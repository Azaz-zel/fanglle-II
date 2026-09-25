<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Event;
use App\Models\VenueTable;
use App\Support\Night;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'days' => ['nullable', 'integer', 'between:1,14'],
        ]);

        $from = isset($query['from']) ? Carbon::parse($query['from']) : Night::tonight();
        $until = $from->copy()->addDays(($query['days'] ?? 7) - 1);
        $tables = VenueTable::count();

        $events = Event::withAvailability()
            ->whereBetween('date', [$from->toDateString(), $until->toDateString()])
            ->orderBy('date')
            ->get();

        return response()->json(['events' => $events->map(fn ($event) => $this->present($event, $tables))]);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json($this->present(Event::withAvailability()->find($event->id), VenueTable::count()));
    }

    public function tables(Event $event): JsonResponse
    {
        $holds = $event->tableHolds()->pluck('status', 'venue_table_id');

        return response()->json(['tables' => VenueTable::orderBy('id')->get()->map(fn (VenueTable $table) => $table->only(['code', 'zone', 'shape', 'capacity', 'x', 'y']) + [
            'status' => match ($holds->get($table->id)) {
                BookingStatus::Paid => 'booked',
                BookingStatus::Held => 'held',
                default => 'free',
            },
        ])]);
    }

    private function present(Event $event, int $tables): array
    {
        $date = $event->date->toDateString();
        $free = max(0, $tables - $event->tables_taken);
        $placesLeft = max(0, $event->guestlist_quota - (int) $event->signed);

        return [
            'date' => $date,
            'name' => $event->name,
            'genre' => $event->genre,
            'blurb' => $event->blurb,
            'opens_at' => config('fanglle.night_opens_at'),
            'close_time' => $event->close_time,
            'guestlist_cutoff' => $event->guestlist_cutoff,
            'lineup' => $event->lineup(),
            'min_spend' => $event->minSpend(),
            'tables' => [
                'status' => match (true) {
                    $free === 0 => 'sold_out',
                    $free <= 4 => 'few',
                    default => 'open',
                },
                'free' => $free,
            ],
            'guestlist' => [
                'status' => match (true) {
                    now()->gte(Night::at($date, $event->guestlist_cutoff)) => 'closed',
                    $placesLeft === 0 => 'full',
                    default => 'open',
                },
                'places_left' => $placesLeft,
            ],
        ];
    }
}
