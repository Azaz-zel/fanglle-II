<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminEventsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-25 14:00'); // demo week is Thu 24 to Sun 27
        $this->seed();
    }

    private function asManager(): static
    {
        return $this->actingAs(User::factory()->create(['role' => StaffRole::Manager]));
    }

    private function signUp(string $date, int $people): void
    {
        DB::table('guestlist_signups')->insert([
            'event_id' => Event::where('date', $date)->value('id'), 'name' => 'Guest', 'phone' => '0812'.random_int(1000, 9999),
            'email' => 'g@example.com', 'party_size' => $people, 'qr_mode' => 'group',
        ]);
    }

    private function night(array $overrides = []): array
    {
        return array_replace_recursive([
            'date' => '2026-10-01', 'name' => 'Low Tide', 'genre' => 'Minimal', 'blurb' => 'Quiet start, loud finish.',
            'guestlist_quota' => 150, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
            'min_spend' => ['stage' => 9000000, 'booth' => 14000000, 'bar' => 4500000],
            'lineup' => [
                ['performer' => 'Late One', 'role' => 'headliner', 'starts_at' => '00:30', 'ends_at' => '03:00'],
                ['performer' => 'Early One', 'role' => 'warm_up', 'starts_at' => '22:00', 'ends_at' => '23:30'],
                ['performer' => 'Middle One', 'role' => 'support', 'starts_at' => '23:30', 'ends_at' => '00:30'],
            ],
        ], $overrides);
    }

    public function test_signed_out_is_401_and_door_staff_is_403(): void
    {
        $this->getJson('/api/admin/events')->assertUnauthorized();
        $this->postJson('/api/admin/events', $this->night())->assertUnauthorized();

        $this->actingAs(User::factory()->create(['role' => StaffRole::Door]));
        $this->getJson('/api/admin/events')->assertForbidden()->assertExactJson(['message' => 'Only managers can do this.']);
        $this->putJson('/api/admin/events/2026-09-25', $this->night())->assertForbidden();
        $this->assertSame('Second Wave', Event::where('date', '2026-09-25')->value('name'));
    }

    public function test_list_shows_every_night_with_people_signed_up(): void
    {
        $this->signUp('2026-09-25', 4);

        $this->asManager()->getJson('/api/admin/events')->assertOk()->assertExactJson(['events' => [
            ['date' => '2026-09-24', 'name' => 'Descent', 'genre' => 'Melodic techno', 'guestlist_quota' => 200, 'signed' => 0],
            ['date' => '2026-09-25', 'name' => 'Second Wave', 'genre' => 'Afro house', 'guestlist_quota' => 200, 'signed' => 4],
            ['date' => '2026-09-26', 'name' => 'Fall Line', 'genre' => 'Tech house', 'guestlist_quota' => 250, 'signed' => 0],
            ['date' => '2026-09-27', 'name' => 'Afterglow', 'genre' => 'Deep house', 'guestlist_quota' => 200, 'signed' => 0],
        ]]);
    }

    public function test_detail_has_everything_the_form_edits(): void
    {
        $this->asManager()->getJson('/api/admin/events/2026-09-24')->assertOk()->assertExactJson([
            'date' => '2026-09-24', 'name' => 'Descent', 'genre' => 'Melodic techno',
            'blurb' => 'Long, slow builds and a room that gets darker as it gets louder.',
            'guestlist_quota' => 200, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
            'min_spend' => ['stage' => 10000000, 'booth' => 15000000, 'bar' => 5000000],
            'lineup' => [
                ['performer' => 'Rafi Hartono', 'role' => 'warm_up', 'starts_at' => '22:00', 'ends_at' => '00:00'],
                ['performer' => 'Ilse Varga', 'role' => 'headliner', 'starts_at' => '00:00', 'ends_at' => '03:00'],
                ['performer' => 'Rafi Hartono', 'role' => 'closing', 'starts_at' => '03:00', 'ends_at' => '04:00'],
            ],
            'signed' => 0,
        ]);
    }

    public function test_unknown_night_is_a_readable_404(): void
    {
        $this->asManager()->getJson('/api/admin/events/2026-12-31')->assertNotFound()
            ->assertExactJson(['message' => "There's no event on that night."]);
        $this->putJson('/api/admin/events/2026-12-31', $this->night())->assertNotFound();
    }

    // T-W2 and the B2.2 pass criterion: a new night is stored in night order and is public straight away.
    public function test_new_event_sorts_sets_through_midnight_and_goes_public(): void
    {
        $this->asManager()->postJson('/api/admin/events', $this->night())->assertCreated()
            ->assertJsonPath('date', '2026-10-01')
            ->assertJsonPath('lineup.*.starts_at', ['22:00', '23:30', '00:30'])
            ->assertJsonPath('signed', 0);

        $this->assertSame([0, 1, 2], Event::where('date', '2026-10-01')->first()->lineupSlots->pluck('position')->all());

        $public = $this->getJson('/api/events?from=2026-10-01&days=1')->assertOk()->json('events');
        $this->assertSame(['2026-10-01'], array_column($public, 'date'));
        $this->assertSame(['Early One', 'Middle One', 'Late One'], array_column($public[0]['lineup'], 'performer'));
        $this->assertSame(['stage' => 9000000, 'booth' => 14000000, 'bar' => 4500000], $public[0]['min_spend']);
    }

    // T-W3
    public function test_closing_must_be_after_opening_by_night_time(): void
    {
        $this->asManager()->postJson('/api/admin/events', $this->night(['close_time' => '14:00']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['close_time' => 'Closing has to be after the 3 pm opening.']);

        config(['fanglle.night_opens_at' => '15:30']);
        $this->postJson('/api/admin/events', $this->night(['close_time' => '15:00']))
            ->assertJsonValidationErrors(['close_time' => 'Closing has to be after the 3:30 pm opening.']);

        $this->postJson('/api/admin/events', $this->night(['close_time' => '04:00']))->assertCreated();
    }

    public function test_a_date_can_only_have_one_event(): void
    {
        $this->asManager()->postJson('/api/admin/events', $this->night(['date' => '2026-09-25']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date' => "There's already an event on Fri 25 Sep."]);

        $this->postJson('/api/admin/events', $this->night(['date' => null]))
            ->assertJsonValidationErrors(['date' => 'Choose the date.']);
    }

    public function test_a_double_submit_that_loses_the_race_is_409_not_500(): void
    {
        // The second of two simultaneous saves passes validation, then hits the unique index.
        Event::creating(fn (Event $event) => DB::table('events')->insert(
            Event::where('date', '2026-09-24')->first()->only(['name', 'guestlist_quota', 'guestlist_cutoff', 'close_time', 'min_spend_stage', 'min_spend_booth', 'min_spend_bar'])
            + ['date' => $event->date->toDateString()]
        ));

        $this->asManager()->postJson('/api/admin/events', $this->night(['date' => '2026-10-01']))
            ->assertStatus(409)
            ->assertExactJsonStructure(['message']);
    }

    public function test_form_errors_use_the_mockup_wording_and_row_keys(): void
    {
        $bad = $this->night([
            'name' => '  ', 'blurb' => str_repeat('a', 221), 'guestlist_quota' => 0,
            'min_spend' => ['stage' => 0, 'booth' => '', 'bar' => -5],
            'lineup' => [
                ['performer' => '', 'role' => 'support', 'starts_at' => '22:00', 'ends_at' => '22:00'],
                ['performer' => 'X', 'role' => 'warm_up', 'starts_at' => '', 'ends_at' => '23:00'],
            ],
        ]);
        $bad['lineup'] = array_slice($bad['lineup'], 0, 2);

        $this->asManager()->postJson('/api/admin/events', $bad)->assertUnprocessable()->assertJsonValidationErrors([
            'name' => 'Give the night a name.',
            'blurb' => 'Keep it under 220 characters.',
            'guestlist_quota' => 'Enter a whole number of places.',
            'min_spend.stage' => 'Enter an amount above zero.',
            'min_spend.booth' => 'Enter an amount above zero.',
            'min_spend.bar' => 'Enter an amount above zero.',
            'lineup' => 'Mark at least one performer as Headliner.',
            'lineup.0.performer' => "Add the performer's name, or remove this row.",
            'lineup.0.ends_at' => "The set can't start and end at the same time.",
            'lineup.1.starts_at' => 'Add a start and end time.',
        ]);
        $this->assertNull(Event::where('date', '2026-10-01')->first());
    }

    public function test_malformed_payload_is_422_not_500(): void
    {
        $this->asManager()->postJson('/api/admin/events', [
            'date' => '2026-10-01xyz', 'name' => ['x'], 'guestlist_quota' => 'lots', 'close_time' => '4am',
            'min_spend' => 'cheap', 'lineup' => 'everyone',
        ])->assertUnprocessable()->assertJsonValidationErrors(['date', 'name', 'guestlist_quota', 'close_time', 'min_spend', 'lineup']);

        $payload = $this->night();
        $payload['lineup'] = ['x', ['role' => 'headliner', 'starts_at' => '25:00']];
        $this->postJson('/api/admin/events', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors(['lineup.0.performer', 'lineup.1.performer', 'lineup.1.starts_at', 'lineup.1.ends_at']);
    }

    public function test_edit_replaces_the_lineup_but_never_the_date(): void
    {
        $this->asManager()->putJson('/api/admin/events/2026-09-25', $this->night(['date' => '2026-12-31', 'name' => 'Second Wave II']))
            ->assertOk()
            ->assertJsonPath('date', '2026-09-25')
            ->assertJsonPath('name', 'Second Wave II')
            ->assertJsonPath('lineup.*.performer', ['Early One', 'Middle One', 'Late One']);

        $this->assertSame(3, Event::where('date', '2026-09-25')->first()->lineupSlots()->count());
        $this->assertNull(Event::where('date', '2026-12-31')->first());
    }

    public function test_quota_cannot_drop_below_people_already_signed_up(): void
    {
        $this->signUp('2026-09-25', 7);
        $this->signUp('2026-09-25', 5);

        $this->asManager()->putJson('/api/admin/events/2026-09-25', $this->night(['guestlist_quota' => 11]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['guestlist_quota' => 'At least 12. That many people are already on the list.']);

        $this->putJson('/api/admin/events/2026-09-25', $this->night(['guestlist_quota' => 12]))
            ->assertOk()->assertJsonPath('signed', 12)->assertJsonPath('guestlist_quota', 12);
    }
}
