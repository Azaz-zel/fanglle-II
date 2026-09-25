<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CheckInMethod;
use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The door log: every check-in of the night, newest first. ?overrides=1 and ?conflicts=1 narrow it; counts never do. */
class CheckInController extends Controller
{
    public function __invoke(Request $request, Event $event): JsonResponse
    {
        $all = CheckIn::with('pass.tableBooking.venueTable', 'user')
            ->whereHas('pass', fn ($pass) => $pass->whereBelongsTo($event))
            ->latest('scanned_at')->latest('id')
            ->get();
        $overrides = fn ($items) => $items->where('method', CheckInMethod::Override);
        $conflicts = fn ($items) => $items->where('conflict', true);

        $shown = $all->when($request->boolean('overrides'), $overrides)->when($request->boolean('conflicts'), $conflicts);

        return response()->json([
            'check_ins' => $shown->values()->map(fn (CheckIn $checkIn) => [
                'id' => $checkIn->id,
                'scanned_at' => $checkIn->scanned_at->toIso8601String(),
                'holder_name' => $checkIn->pass->holder_name,
                'kind' => $checkIn->pass->kind,
                'table_code' => $checkIn->pass->tableBooking?->venueTable->code,
                'count' => $checkIn->count,
                'method' => $checkIn->method,
                'conflict' => $checkIn->conflict,
                'staff_name' => $checkIn->user->name,
            ]),
            'counts' => ['total' => $all->count(), 'overrides' => $overrides($all)->count(), 'conflicts' => $conflicts($all)->count()],
        ]);
    }
}
