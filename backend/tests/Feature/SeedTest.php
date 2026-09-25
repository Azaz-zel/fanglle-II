<?php

namespace Tests\Feature;

use App\Enums\LineupRole;
use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Models\Event;
use App\Models\User;
use App\Models\VenueTable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class SeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_the_floor_plan_this_weeks_nights_and_staff(): void
    {
        $this->travelTo('2026-09-25 14:00');
        $this->seed();

        $this->assertSame(16, VenueTable::count());
        $this->assertEquals(['S' => 4, 'B' => 6, 'T' => 6], VenueTable::pluck('code')->countBy(fn ($c) => $c[0])->all());
        $b5 = VenueTable::where('code', 'B5')->first();
        $this->assertSame(['booth', 'booth', 12, 928, 265], [$b5->zone->value, $b5->shape->value, $b5->capacity, $b5->x, $b5->y]);

        $this->assertSame(
            ['2026-09-24 Descent', '2026-09-25 Second Wave', '2026-09-26 Fall Line', '2026-09-27 Afterglow'],
            Event::orderBy('date')->get()->map(fn ($e) => $e->date->format('Y-m-d').' '.$e->name)->all(),
        );

        $this->assertEquals(
            ['manager' => 1, 'door' => 2],
            User::where('status', StaffStatus::Active)->get()->countBy(fn ($u) => $u->role->value)->all(),
        );
        $this->assertSame(StaffRole::Manager, User::where('email', 'manager@thefanglle.example')->first()->role);
    }

    // F2: before noon it is still last night, so Monday morning still belongs to the weekend just gone.
    #[TestWith(['2026-09-28 11:59', '2026-09-24'])]
    #[TestWith(['2026-09-28 12:00', '2026-10-01'])]
    #[TestWith(['2026-09-24 00:30', '2026-09-24'])]
    #[TestWith(['2026-09-30 20:00', '2026-10-01'])]
    public function test_the_demo_week_is_thursday_to_sunday_of_the_current_night(string $now, string $thursday): void
    {
        $this->travelTo($now);
        $this->seed();

        $dates = Event::orderBy('date')->pluck('date')->map->format('Y-m-d D')->all();
        $start = new \DateTimeImmutable($thursday);
        $this->assertSame(
            array_map(fn ($d) => $start->modify("+$d day")->format('Y-m-d D'), [0, 1, 2, 3]),
            $dates,
        );
    }

    public function test_second_wave_lineup_is_in_night_order_with_two_guest_stars(): void
    {
        $this->seed();

        $slots = Event::where('name', 'Second Wave')->first()->lineupSlots;

        $this->assertSame(['22:00', '23:30', '00:30', '02:30', '03:30'], $slots->map(fn ($s) => substr($s->starts_at, 0, 5))->all());
        $this->assertSame(['Bayu Kencana', 'Lintang'], $slots->where('role', LineupRole::GuestStar)->pluck('performer')->values()->all());
        $this->assertSame([0, 1, 2, 3, 4], $slots->pluck('position')->all());
    }
}
