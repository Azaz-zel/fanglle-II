<?php

namespace App\Http\Controllers;

use App\Enums\PassKind;
use App\Models\Pass;
use App\Support\EntryCode;
use App\Support\PassSigner;
use Illuminate\Http\JsonResponse;

class PassController extends Controller
{
    /** The guest's QR page (/p/:id). The ULID in the URL is the credential. */
    public function show(Pass $pass): JsonResponse
    {
        $pass->load('event', 'tableBooking.venueTable', 'guestlistSignup');
        $event = $pass->event;
        $booking = $pass->tableBooking;
        $organiser = $pass->guestlistSignup?->name;

        return response()->json([
            'kind' => $pass->kind,
            'holder_name' => $pass->holder_name,
            'people' => $pass->people,
            'inside_count' => $pass->inside_count,
            'event' => [
                'date' => $event->date->toDateString(),
                'name' => $event->name,
                'opens_at' => config('fanglle.night_opens_at'),
                'close_time' => $event->close_time,
                'guestlist_cutoff' => $event->guestlist_cutoff,
            ],
            'qr' => (new PassSigner)->sign($pass->public_id, $event->date->toDateString(), $pass->kind->value),
            'entry_code' => EntryCode::format($pass->entry_code),
            'status' => $pass->status(),
            // Shown on the page for table passes: "B5 · Booths", booking code, still to spend.
            'table_code' => $booking?->venueTable->code,
            'table_zone' => $booking?->venueTable->zone,
            'booking_code' => $booking?->code,
            'left_to_spend' => $booking ? $booking->min_spend - $booking->deposit : null,
            // "Guest of Ayu Pratiwi" on a personal pass that isn't the organiser's own.
            'organiser' => $pass->kind === PassKind::Personal && $organiser !== $pass->holder_name ? $organiser : null,
        ])->header('Cache-Control', 'no-store'); // the page keeps its own offline copy
    }
}
