<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\VenueTable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PublicEventsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-25 14:00'); // Friday afternoon: demo week is Thu 24 to Sun 27
        $this->seed();
    }

    private function secondWave(): Event
    {
        return Event::where('date', '2026-09-25')->first();
    }

    private function book(int $count, string $status = 'paid', string $heldUntil = '2026-09-25 14:10'): void
    {
        foreach (VenueTable::whereNotIn('id', DB::table('table_bookings')->pluck('venue_table_id'))->limit($count)->get() as $table) {
            DB::table('table_bookings')->insert([
                'code' => 'F2-'.$table->code.$status[0], 'event_id' => $this->secondWave()->id, 'venue_table_id' => $table->id,
                'status' => $status, 'name' => 'Guest', 'phone' => '081234567890', 'email' => 'g@example.com', 'party_size' => 2,
                'min_spend' => 1, 'deposit' => 1, 'held_until' => $heldUntil,
            ]);
        }
    }

    private function signUp(int $people, ?string $removedAt = null): void
    {
        static $n = 0;
        DB::table('guestlist_signups')->insert([
            'event_id' => $this->secondWave()->id, 'name' => 'Guest', 'phone' => '0812'.++$n, 'email' => 'g@example.com',
            'party_size' => $people, 'qr_mode' => 'group', 'removed_at' => $removedAt,
        ]);
    }

    public function test_event_detail_matches_the_contract(): void
    {
        $this->getJson('/api/events/2026-09-25')->assertOk()->assertExactJson([
            'date' => '2026-09-25', 'name' => 'Second Wave', 'genre' => 'Afro house', 'blurb' => 'Percussion from the first record to the last.',
            'opens_at' => '15:00', 'close_time' => '04:00', 'guestlist_cutoff' => '23:00',
            'lineup' => [
                ['performer' => 'Kirana', 'role' => 'warm_up', 'starts_at' => '22:00', 'ends_at' => '23:30'],
                ['performer' => 'Bayu Kencana', 'role' => 'guest_star', 'starts_at' => '23:30', 'ends_at' => '00:30'],
                ['performer' => 'Marcel Oduya', 'role' => 'headliner', 'starts_at' => '00:30', 'ends_at' => '02:30'],
                ['performer' => 'Lintang', 'role' => 'guest_star', 'starts_at' => '02:30', 'ends_at' => '03:30'],
                ['performer' => 'Kirana', 'role' => 'closing', 'starts_at' => '03:30', 'ends_at' => '04:00'],
            ],
            'min_spend' => ['stage' => 16000000, 'booth' => 24000000, 'bar' => 8000000],
            'tables' => ['status' => 'open', 'free' => 16],
            'guestlist' => ['status' => 'open', 'places_left' => 200],
        ]);
    }

    public function test_opening_time_comes_from_config(): void
    {
        config(['fanglle.night_opens_at' => '16:00']);

        $this->getJson('/api/events/2026-09-25')->assertJsonPath('opens_at', '16:00');
    }

    public function test_week_list_starts_tonight_and_each_item_is_the_detail_shape(): void
    {
        $events = $this->getJson('/api/events')->assertOk()->json('events');

        $this->assertSame(['2026-09-25', '2026-09-26', '2026-09-27'], array_column($events, 'date'));
        $this->assertSame($this->getJson('/api/events/2026-09-25')->json(), $events[0]);
    }

    public function test_week_list_takes_from_and_days(): void
    {
        $this->getJson('/api/events?from=2026-09-24&days=2')->assertOk()
            ->assertJsonPath('events.*.date', ['2026-09-24', '2026-09-25']);
    }

    public function test_before_noon_the_list_still_starts_with_last_night(): void
    {
        $this->travelTo('2026-09-26 03:00');

        $this->assertSame('2026-09-25', $this->getJson('/api/events')->json('events.0.date'));
    }

    public function test_week_list_rejects_bad_ranges(): void
    {
        $this->getJson('/api/events?days=15')->assertUnprocessable()->assertJsonValidationErrors('days');
        $this->getJson('/api/events?days=0')->assertUnprocessable()->assertJsonValidationErrors('days');
        $this->getJson('/api/events?from=2026-02-30')->assertUnprocessable()->assertJsonValidationErrors('from');
    }

    public function test_tables_are_few_at_four_free_and_count_only_live_holds(): void
    {
        $this->book(11);
        $this->book(1, 'held', '2026-09-25 14:10');   // still held
        $this->book(3, 'held', '2026-09-25 13:59');   // hold ran out, scheduler not run yet
        $this->book(2, 'released');

        $this->getJson('/api/events/2026-09-25')->assertJsonPath('tables', ['status' => 'few', 'free' => 4]);
    }

    public function test_tables_sold_out_at_zero_free(): void
    {
        $this->book(16);

        $this->getJson('/api/events/2026-09-25')->assertJsonPath('tables', ['status' => 'sold_out', 'free' => 0]);
    }

    public function test_guestlist_full_when_active_signups_fill_the_quota(): void
    {
        $this->secondWave()->update(['guestlist_quota' => 10]);
        $this->signUp(4);
        $this->signUp(5, '2026-09-25 12:00'); // removed, does not count

        $this->getJson('/api/events/2026-09-25')->assertJsonPath('guestlist', ['status' => 'open', 'places_left' => 6]);

        $this->signUp(6);
        $this->getJson('/api/events/2026-09-25')->assertJsonPath('guestlist', ['status' => 'full', 'places_left' => 0]);
    }

    public function test_guestlist_closes_at_a_cutoff_after_midnight(): void
    {
        $this->secondWave()->update(['guestlist_cutoff' => '00:30']);

        $this->travelTo('2026-09-26 00:15');
        $this->getJson('/api/events/2026-09-25')->assertJsonPath('guestlist.status', 'open');

        $this->travelTo('2026-09-26 00:45');
        $this->getJson('/api/events/2026-09-25')->assertJsonPath('guestlist.status', 'closed');
    }

    public function test_guestlist_closed_wins_over_full(): void
    {
        $this->secondWave()->update(['guestlist_quota' => 4]);
        $this->signUp(4);
        $this->travelTo('2026-09-25 23:00');

        $this->getJson('/api/events/2026-09-25')->assertJsonPath('guestlist', ['status' => 'closed', 'places_left' => 0]);
    }

    public function test_no_event_is_a_readable_404(): void
    {
        foreach (['2026-09-28', 'tonight', '2026-09-25xyz', '2026-02-30'] as $date) {
            $this->getJson("/api/events/{$date}")->assertNotFound()->assertExactJson(['message' => "There's no event on that night."]);
        }
    }
}
