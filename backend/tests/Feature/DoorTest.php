<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\CheckInMethod;
use App\Enums\PassKind;
use App\Enums\QrMode;
use App\Enums\StaffRole;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\GuestlistSignup;
use App\Models\Pass;
use App\Models\TableBooking;
use App\Models\User;
use App\Models\VenueTable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class DoorTest extends TestCase
{
    use RefreshDatabase;

    private const TONIGHT = '2026-09-25';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(self::TONIGHT.' 20:00');
        $this->seed();
    }

    private function pass(array $attributes = []): Pass
    {
        return Pass::create($attributes + [
            'event_id' => Event::where('date', self::TONIGHT)->value('id'), 'kind' => PassKind::Group, 'holder_name' => 'Ayu Pratiwi', 'people' => 2,
        ]);
    }

    private function staff(StaffRole $role = StaffRole::Door): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function item(Pass $pass, array $overrides = []): array
    {
        return $overrides + [
            'client_uuid' => (string) Str::uuid(), 'public_id' => $pass->public_id, 'count' => 1, 'method' => 'scan',
            'scanned_at' => now()->toIso8601String(),
        ];
    }

    private function checkIn(array $items, ?User $as = null): TestResponse
    {
        return $this->actingAs($as ?? $this->staff())->postJson('/api/door/check-ins', ['items' => $items]);
    }

    // T-A2
    public function test_every_door_endpoint_needs_a_login(): void
    {
        $this->getJson('/api/door/public-key')->assertUnauthorized();
        $this->getJson('/api/door/'.self::TONIGHT.'/manifest')->assertUnauthorized();
        $this->getJson('/api/door/'.self::TONIGHT.'/codes/K7QM4TXP')->assertUnauthorized();
        $this->postJson('/api/door/check-ins', ['items' => []])->assertUnauthorized();
    }

    // T-P5: the device gets the last 4 phone digits and a hash of the code, never the phone or the code.
    public function test_the_manifest_never_carries_a_full_phone_or_an_entry_code(): void
    {
        $event = Event::where('date', self::TONIGHT)->first();
        $signup = GuestlistSignup::create([
            'event_id' => $event->id, 'name' => 'Ayu Pratiwi', 'phone' => '+6281234567890', 'email' => 'ayu@example.com',
            'party_size' => 3, 'qr_mode' => QrMode::Group,
        ]);
        $guest = tap($signup->passes()->create(['event_id' => $event->id, 'kind' => PassKind::Group, 'holder_name' => 'Ayu Pratiwi', 'people' => 3]))
            ->update(['entry_code' => 'K7QM4TXP']);
        $booking = TableBooking::create([
            'code' => 'F2-TEST', 'event_id' => $event->id, 'venue_table_id' => VenueTable::where('code', 'B5')->value('id'),
            'status' => BookingStatus::Paid, 'name' => 'Dimas Arya', 'phone' => '+6285711112222', 'email' => 'dimas@example.com',
            'party_size' => 6, 'min_spend' => 5_000_000, 'deposit' => 1_000_000, 'held_until' => now(),
        ]);
        $table = $booking->pass()->create(['event_id' => $event->id, 'kind' => PassKind::Table, 'holder_name' => 'Dimas Arya', 'people' => 6]);
        $revoked = $this->pass(['revoked_at' => now()]);

        $response = $this->actingAs($this->staff())->getJson('/api/door/'.self::TONIGHT.'/manifest')
            ->assertOk()
            ->assertJsonPath('synced_at', '2026-09-25T20:00:00+08:00')
            ->assertJsonCount(3, 'passes');

        $byId = collect($response->json('passes'))->keyBy('public_id');
        $this->assertSame([
            'public_id' => $guest->public_id, 'kind' => 'group', 'holder_name' => 'Ayu Pratiwi', 'people' => 3, 'inside_count' => 0,
            'phone_last4' => '7890', 'table_code' => null, 'revoked' => false, 'entry_code_hash' => hash('sha256', 'K7QM4TXP'),
        ], $byId[$guest->public_id]);
        $this->assertSame(['2222', 'B5', 'table'], [$byId[$table->public_id]['phone_last4'], $byId[$table->public_id]['table_code'], $byId[$table->public_id]['kind']]);
        $this->assertTrue($byId[$revoked->public_id]['revoked']);

        $raw = $response->getContent();
        foreach (['K7QM4TXP', 'K7QM-4TXP', '81234567890', '85711112222', 'entry_code"', '"phone"'] as $secret) {
            $this->assertStringNotContainsString($secret, $raw);
        }
        foreach (Pass::pluck('entry_code') as $code) {
            $this->assertStringNotContainsString($code, $raw);
        }
    }

    public function test_since_sends_only_what_changed(): void
    {
        [$untouched, $checkedIn, $cancelled] = [$this->pass(), $this->pass(), $this->pass()];
        $staff = $this->staff();

        $this->travel(1)->minute();
        $syncedAt = $this->actingAs($staff)->getJson('/api/door/'.self::TONIGHT.'/manifest')->json('synced_at');

        $this->travel(1)->minute();
        $this->checkIn([$this->item($checkedIn)], $staff)->assertOk();
        $cancelled->update(['revoked_at' => now()]);

        $changed = $this->actingAs($staff)->getJson('/api/door/'.self::TONIGHT.'/manifest?since='.urlencode($syncedAt))
            ->assertOk()->json('passes');

        $this->assertEqualsCanonicalizing([$checkedIn->public_id, $cancelled->public_id], array_column($changed, 'public_id'));
        $this->assertNotContains($untouched->public_id, array_column($changed, 'public_id'));
        $this->actingAs($staff)->getJson('/api/door/'.self::TONIGHT.'/manifest?since=yesterday-ish')->assertUnprocessable();
    }

    public function test_a_night_without_an_event_is_404(): void
    {
        $this->actingAs($this->staff())->getJson('/api/door/2026-12-31/manifest')
            ->assertNotFound()->assertExactJson(['message' => "There's no event on that night."]);
    }

    // T-P4 through the endpoint.
    public function test_an_entry_code_typed_any_way_finds_the_pass(): void
    {
        $pass = tap($this->pass())->update(['entry_code' => 'K7QM4TXP']);
        $this->actingAs($this->staff());

        foreach (['k7qm 4txp', 'K7QM-4TXP', 'K7QM4TXP'] as $typed) {
            $this->getJson('/api/door/'.self::TONIGHT.'/codes/'.rawurlencode($typed))
                ->assertOk()->assertJsonPath('public_id', $pass->public_id)->assertJsonPath('entry_code_hash', hash('sha256', 'K7QM4TXP'));
        }

        $pass->update(['entry_code' => 'K70M4TXP']);
        $this->getJson('/api/door/'.self::TONIGHT.'/codes/K7OM-4TXP')->assertOk()->assertJsonPath('public_id', $pass->public_id);

        // Another night's pass is not tonight's.
        $this->getJson('/api/door/2026-09-26/codes/K70M4TXP')
            ->assertNotFound()->assertExactJson(['message' => 'No pass with this code tonight. Check the letters, or search by name.']);
    }

    // T-P6, server half: 10 wrong codes a minute per account, then everything is refused until the minute is up.
    public function test_wrong_codes_lock_the_account_for_a_minute(): void
    {
        $pass = tap($this->pass())->update(['entry_code' => 'K7QM4TXP']);
        $staff = $this->staff();
        $url = fn (string $code) => '/api/door/'.self::TONIGHT.'/codes/'.$code;

        for ($i = 0; $i < 15; $i++) {
            $this->actingAs($staff)->getJson($url('K7QM4TXP'))->assertOk(); // right codes never count
        }
        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($staff)->getJson($url('ZZZZZZZZ'))->assertNotFound();
        }

        $this->actingAs($staff)->getJson($url('K7QM4TXP'))
            ->assertTooManyRequests()
            ->assertHeader('Retry-After')
            ->assertExactJson(['message' => 'Too many wrong codes. Wait a minute, then try again.']);
        $this->actingAs($this->staff())->getJson($url('K7QM4TXP'))->assertOk(); // another account is not locked

        $this->travel(61)->seconds();
        $this->actingAs($staff)->getJson($url('K7QM4TXP'))->assertOk()->assertJsonPath('public_id', $pass->public_id);
    }

    // T-P7
    public function test_the_same_client_uuid_counts_once(): void
    {
        $pass = $this->pass(['people' => 4]);
        $item = $this->item($pass, ['count' => 2]);
        $staff = $this->staff();

        foreach (range(1, 3) as $_) {
            $this->checkIn([$item], $staff)
                ->assertOk()
                ->assertExactJson(['results' => [['client_uuid' => $item['client_uuid'], 'inside_count' => 2, 'conflict' => false]]]);
        }
        $this->checkIn([$item, $item], $staff)->assertOk()->assertJsonPath('results.1.inside_count', 2);

        $this->assertSame(2, $pass->fresh()->inside_count);
        $this->assertDatabaseCount('check_ins', 1);
        $this->assertDatabaseHas('check_ins', ['client_uuid' => $item['client_uuid'], 'user_id' => $staff->id, 'count' => 2, 'method' => 'scan']);
    }

    // T-P8: two doors without signal let the same pair in. Both are recorded; the second is a conflict.
    public function test_two_offline_doors_on_one_pass_are_both_recorded_with_a_conflict(): void
    {
        $pass = $this->pass(['people' => 2]);
        $earlier = now()->subMinutes(20)->toIso8601String();

        $this->checkIn([
            $this->item($pass, ['count' => 2, 'scanned_at' => $earlier]),
            $this->item($pass, ['count' => 2, 'scanned_at' => $earlier, 'method' => 'code']),
        ])
            ->assertOk()
            ->assertJsonPath('results.0.inside_count', 2)->assertJsonPath('results.0.conflict', false)
            ->assertJsonPath('results.1.inside_count', 4)->assertJsonPath('results.1.conflict', true);

        $this->assertSame(4, $pass->fresh()->inside_count);
        $this->assertSame([false, true], CheckIn::where('pass_id', $pass->id)->orderBy('id')->pluck('conflict')->all());
    }

    public function test_scanned_at_is_stored_as_the_moment_it_was_whatever_zone_the_device_sent(): void
    {
        $pass = $this->pass();
        $this->checkIn([$this->item($pass, ['scanned_at' => '2026-09-25T11:55:00.000Z'])])->assertOk();

        $this->assertDatabaseHas('check_ins', ['pass_id' => $pass->id, 'scanned_at' => '2026-09-25 19:55:00']);
    }

    public function test_a_cancelled_pass_scanned_live_is_refused(): void
    {
        $pass = $this->pass(['revoked_at' => now()->subHour()]);

        $this->checkIn([$this->item($pass)])
            ->assertConflict()
            ->assertExactJson(['message' => "This pass was cancelled. Don't let them in."]);

        // In a batch it is one refused item among the rest.
        $other = $this->pass();
        $refused = $this->item($pass);
        $this->checkIn([$refused, $this->item($other)])
            ->assertOk()
            ->assertJsonPath('results.0', ['client_uuid' => $refused['client_uuid'], 'error' => 'revoked'])
            ->assertJsonPath('results.1.inside_count', 1);

        $this->assertSame(0, $pass->fresh()->inside_count);
        $this->assertDatabaseMissing('check_ins', ['pass_id' => $pass->id]);
    }

    public function test_a_cancelled_pass_synced_late_or_overridden_is_recorded_with_a_conflict(): void
    {
        $pass = $this->pass(['revoked_at' => now()->subHour()]);

        $this->checkIn([$this->item($pass, ['scanned_at' => now()->subSeconds(121)->toIso8601String()])])
            ->assertOk()->assertJsonPath('results.0.conflict', true)->assertJsonPath('results.0.inside_count', 1);

        $this->checkIn([$this->item($pass, ['method' => 'override'])], $this->staff(StaffRole::Manager))
            ->assertOk()->assertJsonPath('results.0.conflict', true)->assertJsonPath('results.0.inside_count', 2);

        $this->assertDatabaseHas('check_ins', ['pass_id' => $pass->id, 'method' => 'override', 'conflict' => true]);
        $this->assertDatabaseCount('check_ins', 2);
    }

    // The one rule behind the 409, at its 120-second edge.
    public function test_online_means_scanned_at_most_120_seconds_ago(): void
    {
        $revoked = $this->pass(['revoked_at' => now()]);

        $this->assertTrue($revoked->refusesScan(now(), CheckInMethod::Scan));
        $this->assertTrue($revoked->refusesScan(now()->addSeconds(30), CheckInMethod::Code)); // device clock ahead
        $this->assertTrue($revoked->refusesScan(now()->subSeconds(120), CheckInMethod::Scan));
        $this->assertFalse($revoked->refusesScan(now()->subSeconds(121), CheckInMethod::Scan));
        $this->assertFalse($revoked->refusesScan(now(), CheckInMethod::Override));
        $this->assertFalse($this->pass()->refusesScan(now(), CheckInMethod::Scan));
    }

    public function test_door_staff_cannot_override(): void
    {
        $pass = $this->pass();

        $this->checkIn([$this->item($pass), $this->item($pass, ['method' => 'override'])])
            ->assertForbidden()
            ->assertExactJson(['message' => 'Only a manager can let someone in on an override.']);

        $this->assertDatabaseCount('check_ins', 0);
        $this->checkIn([$this->item($pass, ['method' => 'override'])], $this->staff(StaffRole::Manager))->assertOk();
    }

    public function test_an_unknown_pass_is_an_item_error_with_no_record(): void
    {
        $uuid = (string) Str::uuid();

        $this->checkIn([['client_uuid' => $uuid, 'public_id' => '01J00000000000000000000000', 'count' => 1, 'method' => 'scan', 'scanned_at' => now()->toIso8601String()]])
            ->assertOk()
            ->assertExactJson(['results' => [['client_uuid' => $uuid, 'error' => 'unknown_pass']]]);

        $this->assertDatabaseCount('check_ins', 0);
    }

    public function test_a_malformed_batch_is_422(): void
    {
        $item = $this->item($this->pass());

        foreach ([
            [],
            array_fill(0, 201, $item),
            [['client_uuid' => 'not-a-uuid'] + $item],
            [['count' => 0] + $item],
            [['count' => 21] + $item],
            [['method' => 'wave'] + $item],
            [['scanned_at' => 'soon'] + $item],
        ] as $items) {
            $this->checkIn($items)->assertUnprocessable();
        }
        $this->assertDatabaseCount('check_ins', 0);
    }
}
