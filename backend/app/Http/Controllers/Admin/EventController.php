<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EventRequest;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = Event::withSum('activeSignups as signed', 'party_size')->orderBy('date')->get();

        return response()->json(['events' => $events->map(fn (Event $event) => [
            'date' => $event->date->toDateString(),
            'name' => $event->name,
            'genre' => $event->genre,
            'guestlist_quota' => $event->guestlist_quota,
            'signed' => (int) $event->signed,
        ])]);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json($this->present($event));
    }

    public function store(EventRequest $request): JsonResponse
    {
        $event = DB::transaction(function () use ($request) {
            $event = Event::create(['date' => $request->validated('date')] + $request->columns());
            $event->replaceLineup($request->validated('lineup'));

            return $event;
        });

        return response()->json($this->present($event), 201);
    }

    public function update(EventRequest $request, Event $event): JsonResponse
    {
        DB::transaction(function () use ($request, $event) {
            $event->update($request->columns());
            $event->replaceLineup($request->validated('lineup'));
        });

        return response()->json($this->present($event));
    }

    private function present(Event $event): array
    {
        $event->load('lineupSlots')->loadSum('activeSignups as signed', 'party_size');

        return [
            'date' => $event->date->toDateString(),
            'name' => $event->name,
            'genre' => $event->genre,
            'blurb' => $event->blurb,
            'guestlist_quota' => $event->guestlist_quota,
            'opens_at' => config('fanglle.night_opens_at'),
            'guestlist_cutoff' => $event->guestlist_cutoff,
            'close_time' => $event->close_time,
            'min_spend' => $event->minSpend(),
            'lineup' => $event->lineup(),
            'signed' => (int) $event->signed,
        ];
    }
}
