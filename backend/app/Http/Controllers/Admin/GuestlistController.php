<?php

namespace App\Http\Controllers\Admin;

use App\Enums\QrMode;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\GuestlistSignup;
use App\Models\Pass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class GuestlistController extends Controller
{
    private const ARRIVALS = ['none', 'part', 'all'];

    public function index(Request $request, Event $event): JsonResponse
    {
        $filters = $request->validate([
            'qr_mode' => ['nullable', Rule::enum(QrMode::class)],
            'arrival' => ['nullable', Rule::in(self::ARRIVALS)],
            'q' => ['nullable', 'string', 'max:80'],
        ]);

        // ponytail: filtered in PHP; a night's list is capped by its quota, and the chips need every signup anyway.
        $all = $event->activeSignups()->with('passes')->orderBy('name')->orderBy('id')->get()
            ->map(fn (GuestlistSignup $signup) => $this->item($signup));
        $arrival = fn (array $item) => match (true) {
            $item['inside'] === 0 => 'none',
            $item['inside'] >= $item['party_size'] => 'all',
            default => 'part',
        };

        $q = $filters['q'] ?? null;
        $shown = $all
            ->when($filters['qr_mode'] ?? null, fn ($items, $mode) => $items->filter(fn (array $item) => $item['qr_mode']->value === $mode))
            ->when($filters['arrival'] ?? null, fn ($items, $wanted) => $items->filter(fn (array $item) => $arrival($item) === $wanted))
            ->when($q, fn ($items) => $items->filter(fn (array $item) => Str::contains(
                implode("\n", [$item['name'], $item['phone_last4'], ...array_column($item['passes'], 'holder_name')]), $q, ignoreCase: true,
            )));

        return response()->json([
            'signups' => $shown->values(),
            'summary' => [
                'signed' => (int) $all->sum('party_size'),
                'quota' => $event->guestlist_quota,
                'cutoff' => $event->guestlist_cutoff,
            ],
            'counts' => [
                'group' => $all->filter(fn (array $item) => $item['qr_mode'] === QrMode::Group)->count(),
                'personal' => $all->filter(fn (array $item) => $item['qr_mode'] === QrMode::Personal)->count(),
                ...array_merge(array_fill_keys(self::ARRIVALS, 0), array_count_values($all->map($arrival)->all())),
            ],
        ]);
    }

    /** "Resend QR" in the guest panel: the same email and the same 3-an-hour limit as the guest's own resend (F13). */
    public function resend(string $id): JsonResponse
    {
        GuestlistSignup::whereNull('removed_at')->findOrFail($id)->resend();

        return response()->json(['message' => 'QR email sent again.']);
    }

    /** Only a signup nobody has come in on yet. Its QRs stop working, and the number can sign up again (the F8 index skips removed rows). */
    public function destroy(string $id): Response
    {
        DB::transaction(function () use ($id) {
            $signup = GuestlistSignup::whereNull('removed_at')->lockForUpdate()->findOrFail($id);
            $passes = $signup->passes()->lockForUpdate()->get(); // the lock a door check-in takes

            abort_if($passes->sum('inside_count') > 0, 409, "Someone from this group is already inside, so they can't be removed.");

            $signup->update(['removed_at' => now()]);
            $passes->each(fn (Pass $pass) => $pass->update(['revoked_at' => now()])); // Eloquent, so the next manifest ?since= carries it
        });

        return response()->noContent();
    }

    /** The full phone is for the manager's "Message on WhatsApp" (owner's decision, 2026-09-30); the screen shows the last 4. */
    private function item(GuestlistSignup $signup): array
    {
        return [
            'id' => $signup->id,
            'name' => $signup->name,
            'phone' => $signup->phone,
            'phone_last4' => substr($signup->phone, -4),
            'qr_mode' => $signup->qr_mode,
            'party_size' => $signup->party_size,
            'inside' => (int) $signup->passes->whereNull('revoked_at')->sum('inside_count'),
            'created_at' => $signup->created_at->toIso8601String(),
            'passes' => $signup->passes->map(fn (Pass $pass) => [
                'holder_name' => $pass->holder_name,
                'people' => $pass->people,
                'inside_count' => $pass->inside_count,
                'revoked' => $pass->revoked_at !== null,
            ])->all(),
        ];
    }
}
