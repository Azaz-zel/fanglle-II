<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\CheckInMethod;
use App\Enums\PassKind;
use App\Enums\QrMode;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\GuestlistSignup;
use App\Models\Pass;
use App\Models\TableBooking;
use App\Models\User;
use App\Models\VenueTable;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

// PRD Backend 2.3, M11: fanglle:demo-reset keeps the demo on the current week.
class DemoResetTest extends TestCase
{
    use RefreshDatabase;

    /** A paid table with its pass and a check-in, and a guestlist signup with its pass, on one night. */
    private function orders(string $date): void
    {
        $event = Event::firstWhere('date', $date);
        $booking = TableBooking::create([
            'code' => 'F2-'.Str::upper(Str::random(4)), 'event_id' => $event->id, 'venue_table_id' => VenueTable::firstWhere('code', 'B5')->id,
            'status' => BookingStatus::Paid, 'name' => 'Made Wirawan', 'phone' => '081244444410', 'email' => 'made@example.com', 'party_size' => 7,
            'min_spend' => 24000000, 'deposit' => 12000000, 'held_until' => now(), 'paid_at' => now(), 'xendit_invoice_id' => 'inv_'.$date,
        ]);
        DB::table('webhook_events')->insert(['invoice_id' => 'inv_'.$date, 'status' => 'PAID', 'created_at' => now(), 'updated_at' => now()]);
        $table = Pass::create(['event_id' => $event->id, 'kind' => PassKind::Table, 'table_booking_id' => $booking->id, 'holder_name' => 'Made Wirawan', 'people' => 7]);
        CheckIn::create([
            'client_uuid' => (string) Str::uuid(), 'pass_id' => $table->id, 'user_id' => User::first()->id, 'count' => 3,
            'method' => CheckInMethod::Scan, 'scanned_at' => now(),
        ]);
        $signup = GuestlistSignup::create([
            'event_id' => $event->id, 'name' => 'Ayu Pratiwi', 'phone' => '081234561234', 'email' => 'ayu@example.com', 'party_size' => 4, 'qr_mode' => QrMode::Group,
        ]);
        Pass::create(['event_id' => $event->id, 'kind' => PassKind::Group, 'guestlist_signup_id' => $signup->id, 'holder_name' => 'Ayu Pratiwi', 'people' => 4]);
    }

    private function nights(): array
    {
        return Event::orderBy('date')->get()->map(fn ($e) => $e->date->format('Y-m-d').' '.$e->name)->all();
    }

    public function test_monday_noon_replaces_last_week_and_its_orders_with_this_week(): void
    {
        $this->travelTo('2026-09-25 14:00');
        $this->seed();
        $this->orders('2026-09-25');

        $this->travelTo('2026-09-28 12:00');
        $this->artisan('fanglle:demo-reset')
            ->expectsOutput('Removed 4 nights from before this week. This week: Thu 1 Oct Descent, Fri 2 Oct Second Wave, Sat 3 Oct Fall Line, Sun 4 Oct Afterglow.')
            ->assertSuccessful();

        $this->assertSame(['2026-10-01 Descent', '2026-10-02 Second Wave', '2026-10-03 Fall Line', '2026-10-04 Afterglow'], $this->nights());
        $this->assertSame([0, 0, 0, 0, 0], [CheckIn::count(), Pass::count(), TableBooking::count(), GuestlistSignup::count(), DB::table('webhook_events')->count()]);
        $this->assertSame(5, Event::firstWhere('name', 'Second Wave')->lineupSlots()->count());
        $this->assertSame([16, 3], [VenueTable::count(), User::count()]);

        // Again the same day: nothing more to do.
        $this->artisan('fanglle:demo-reset')->assertSuccessful();
        $this->assertCount(4, $this->nights());
    }

    public function test_this_weeks_nights_their_orders_and_a_night_the_manager_set_up_stay(): void
    {
        $this->travelTo('2026-09-28 13:00');
        $this->seed();
        Event::firstWhere('date', '2026-10-01')->update(['name' => 'Descent Extended']);
        Event::create(Event::firstWhere('date', '2026-10-02')->only(['guestlist_quota', 'guestlist_cutoff', 'close_time', 'min_spend_stage', 'min_spend_booth', 'min_spend_bar'])
            + ['date' => '2026-09-29', 'name' => 'Late Hours']);
        $this->orders('2026-10-01');

        // F2: Monday 11:59 still belongs to Sunday's night, so this is still the same week.
        $this->travelTo('2026-10-05 11:59');
        $this->artisan('fanglle:demo-reset')->assertSuccessful();

        $this->assertSame(
            ['2026-09-29 Late Hours', '2026-10-01 Descent Extended', '2026-10-02 Second Wave', '2026-10-03 Fall Line', '2026-10-04 Afterglow'],
            $this->nights(),
        );
        $this->assertSame([1, 2, 1, 1], [CheckIn::count(), Pass::count(), TableBooking::count(), GuestlistSignup::count()]);
    }

    public function test_it_runs_every_day_at_noon(): void
    {
        $event = collect(app(Schedule::class)->events())->first(fn ($e) => str_contains($e->command, 'fanglle:demo-reset'));

        $this->assertNotNull($event);
        $this->assertSame('0 12 * * *', $event->expression);
    }
}
