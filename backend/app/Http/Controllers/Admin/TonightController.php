<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Enums\CheckInMethod;
use App\Enums\PassKind;
use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\Pass;
use App\Models\TableBooking;
use App\Models\VenueTable;
use App\Support\Night;
use Illuminate\Http\JsonResponse;

/** The manager's overview: the big card, the three small ones, arrivals per hour and what needs attention. No phone numbers. */
class TonightController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $event = Event::with('lineupSlots')->firstWhere('date', Night::tonight()->toDateString());
        if (! $event) {
            return response()->json(['event' => null]);
        }

        $opensAt = config('fanglle.night_opens_at');
        $passes = Pass::whereBelongsTo($event)->get();
        $bookings = TableBooking::whereBelongsTo($event)->with('pass', 'venueTable')->get();
        $paid = $bookings->where('status', BookingStatus::Paid);
        $checkIns = CheckIn::with('pass')->whereIn('pass_id', $passes->modelKeys())->latest('scanned_at')->latest('id')->get();
        $overrides = $checkIns->where('method', CheckInMethod::Override);
        $latest = $overrides->first();

        // F2: hours in night order, from the hour doors open to the hour the night closes; 00:00 comes after 23:00.
        $byHour = $checkIns->groupBy(fn (CheckIn $checkIn) => $checkIn->scanned_at->format('H:00'));
        $arrivals = array_map(function (int $h) use ($byHour) {
            $hour = sprintf('%02d:00', $h % 24);
            $in = $byHour->get($hour, collect());
            $tables = $in->filter(fn (CheckIn $checkIn) => $checkIn->pass->kind === PassKind::Table)->sum('count');

            return ['hour' => $hour, 'total' => $in->sum('count'), 'guestlist' => $in->sum('count') - $tables, 'tables' => $tables];
        }, range(intdiv(Night::minutes($opensAt), 60), intdiv(Night::minutes($event->close_time), 60)));

        return response()->json([
            'now' => now()->toIso8601String(), // the club's clock for the timeline, whatever zone the manager's device is in
            'event' => [
                'date' => $event->date->toDateString(),
                'name' => $event->name,
                'genre' => $event->genre,
                'opens_at' => $opensAt,
                'close_time' => $event->close_time,
                'guestlist_cutoff' => $event->guestlist_cutoff,
                'lineup' => $event->lineup(),
            ],
            'capacity' => config('fanglle.venue_capacity'),
            'inside' => (int) $passes->sum('inside_count'),
            'guestlist' => [
                'signed' => (int) $event->activeSignups()->sum('party_size'),
                'quota' => $event->guestlist_quota,
                'arrived' => (int) $passes->where('kind', '!==', PassKind::Table)->whereNull('revoked_at')->sum('inside_count'),
            ],
            'tables' => [
                'total' => VenueTable::count(),
                'booked' => $paid->count(),
                'to_arrive' => $paid->filter(fn (TableBooking $booking) => $booking->pass->inside_count === 0)->count(),
            ],
            'deposits' => (int) $bookings->whereIn('status', [BookingStatus::Paid, BookingStatus::NoShow])->sum('deposit'), // F6: forfeited, still kept
            'held' => $bookings->where('status', BookingStatus::Held)
                ->filter(fn (TableBooking $booking) => $booking->held_until->isFuture())
                ->sortBy('held_until')
                ->map(fn (TableBooking $booking) => [
                    'code' => $booking->code,
                    'table_code' => $booking->venueTable->code,
                    'name' => $booking->name,
                    'held_until' => $booking->held_until->toIso8601String(),
                ])->values(),
            'overrides' => [
                'count' => $overrides->count(),
                'latest' => $latest ? [
                    'holder_name' => $latest->pass->holder_name,
                    'count' => $latest->count,
                    'scanned_at' => $latest->scanned_at->toIso8601String(),
                ] : null,
            ],
            'arrivals' => $arrivals,
        ]);
    }
}
