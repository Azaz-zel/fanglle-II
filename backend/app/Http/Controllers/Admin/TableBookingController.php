<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\TableBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TableBookingController extends Controller
{
    /** The statuses the panel shows, most urgent first. "arrived" is a paid table with someone inside. */
    private const STATUSES = ['held', 'paid', 'arrived', 'released', 'no_show'];

    public function index(Request $request, Event $event): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'q' => ['nullable', 'string', 'max:80'],
        ]);

        // A hold that ran out is released already on the floor plan (S2); here too, so the chips agree.
        TableBooking::releaseExpired(fn ($query) => $query->whereBelongsTo($event));

        // ponytail: filtered in PHP; one night is at most a few hundred bookings, and the chips need all of them anyway.
        $all = TableBooking::whereBelongsTo($event)->with('venueTable', 'pass.checkIns')->latest('id')->get()
            ->map(fn (TableBooking $booking) => $this->item($booking))
            ->sortBy(fn (array $item) => array_search($item['status'], self::STATUSES, true)); // stable, so newest first within a status

        $q = $filters['q'] ?? null;
        $shown = $all
            ->when($filters['status'] ?? null, fn ($items, $status) => $items->where('status', $status))
            ->when($q, fn ($items) => $items->filter(fn (array $item) => Str::contains(
                implode("\n", [$item['name'], $item['code'], $item['table_code'], $item['phone_last4']]), $q, ignoreCase: true,
            )));

        return response()->json([
            'bookings' => $shown->values(),
            'counts' => array_combine(self::STATUSES, array_map(fn ($status) => $all->where('status', $status)->count(), self::STATUSES)),
        ]);
    }

    /** Same answers as the guest's release: the invoice dies first (F5), a paid table is never refunded (F6). */
    public function release(TableBooking $booking): JsonResponse
    {
        $booking->release();

        return response()->json(['status' => BookingStatus::Released]);
    }

    public function noShow(TableBooking $booking): JsonResponse
    {
        $booking->markNoShow();

        return response()->json($this->item($booking->load('venueTable', 'pass.checkIns')));
    }

    /** The full phone is for the manager's "Message on WhatsApp" (owner's decision, 2026-09-30); the screen shows the last 4. */
    private function item(TableBooking $booking): array
    {
        $inside = $booking->pass?->inside_count ?? 0;

        return [
            'code' => $booking->code,
            'status' => $booking->status === BookingStatus::Paid && $inside > 0 ? 'arrived' : $booking->status->value,
            'table_code' => $booking->venueTable->code,
            'zone' => $booking->venueTable->zone,
            'name' => $booking->name,
            'phone' => $booking->phone,
            'phone_last4' => substr($booking->phone, -4),
            'party_size' => $booking->party_size,
            'inside_count' => $inside,
            'deposit' => $booking->deposit,
            'min_spend' => $booking->min_spend,
            'held_until' => $booking->held_until->toIso8601String(),
            'paid_at' => $booking->paid_at?->toIso8601String(),
            'created_at' => $booking->created_at->toIso8601String(),
            'updated_at' => $booking->updated_at->toIso8601String(),
            'check_ins' => $booking->pass?->checkIns->map(fn (CheckIn $checkIn) => [
                'scanned_at' => $checkIn->scanned_at->toIso8601String(),
                'count' => $checkIn->count,
                'method' => $checkIn->method,
            ])->all() ?? [],
        ];
    }
}
