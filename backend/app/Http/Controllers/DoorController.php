<?php

namespace App\Http\Controllers;

use App\Enums\CheckInMethod;
use App\Enums\StaffRole;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\Pass;
use App\Support\PassSigner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;

class DoorController extends Controller
{
    private const WRONG_CODES_PER_MINUTE = 10;

    /** F10: door devices keep this to verify QRs without signal. The private key never leaves the server. */
    public function publicKey(): JsonResponse
    {
        return response()->json((new PassSigner)->publicJwk());
    }

    /** Every pass of the night, for the device to keep. ?since= sends only what changed. */
    public function manifest(Request $request, Event $event): JsonResponse
    {
        $since = $request->validate(['since' => ['nullable', 'date']])['since'] ?? null;
        $now = now(); // taken before the read, so a change during it comes again next time

        $passes = Pass::whereBelongsTo($event)
            ->with('guestlistSignup', 'tableBooking.venueTable')
            // >=, not >: timestamps are whole seconds, so a change in the same second as the last sync is sent again, not lost.
            ->when($since, fn ($query) => $query->where('updated_at', '>=', Date::parse($since)->setTimezone(config('app.timezone'))))
            ->get();

        return response()->json([
            'passes' => $passes->map->manifestItem(),
            'synced_at' => $now->toIso8601String(),
        ]);
    }

    /** F17: a typed entry code, looked up online. Only wrong codes count toward the lock, per account. */
    public function code(Request $request, Event $event, string $code): JsonResponse
    {
        $key = 'door-wrong-code:'.$request->user()->id;
        abort_if(RateLimiter::tooManyAttempts($key, self::WRONG_CODES_PER_MINUTE), 429,
            'Too many wrong codes. Wait a minute, then try again.', ['Retry-After' => RateLimiter::availableIn($key)]);

        $pass = Pass::whereBelongsTo($event)->withEntryCode($code)->with('guestlistSignup', 'tableBooking.venueTable')->first();
        if (! $pass) {
            RateLimiter::hit($key, 60);
            abort(404, 'No pass with this code tonight. Check the letters, or search by name.');
        }

        return response()->json($pass->manifestItem());
    }

    /** F11, F12: one or many check-ins, live or from a door that had no signal. Results come back in item order. */
    public function checkIns(Request $request): JsonResponse
    {
        $items = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.client_uuid' => ['required', 'uuid'],
            'items.*.public_id' => ['required', 'string'],
            'items.*.count' => ['required', 'integer', 'between:1,20'],
            'items.*.method' => ['required', Rule::enum(CheckInMethod::class)],
            'items.*.scanned_at' => ['required', 'date'],
        ])['items'];

        $staff = $request->user();
        abort_if($staff->role !== StaffRole::Manager && in_array(CheckInMethod::Override->value, array_column($items, 'method'), true),
            403, 'Only a manager can let someone in on an override.');

        $results = array_map(fn (array $item) => CheckIn::record($staff, $item), $items);

        // A live scan of one cancelled pass: the door needs a clear no, not a result to read.
        abort_if(count($results) === 1 && ($results[0]['error'] ?? null) === 'revoked', 409, "This pass was cancelled. Don't let them in.");

        return response()->json(['results' => $results]);
    }
}
