<?php

namespace Tests\Feature;

use App\Enums\PassKind;
use App\Enums\StaffRole;
use App\Models\Event;
use App\Models\Pass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PassEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useTestSigningKey();
        $this->travelTo('2026-09-25 20:00');
        $this->seed();
    }

    private function pass(array $attributes = []): Pass
    {
        $event = Event::where('date', '2026-09-25')->first();

        return Pass::create($attributes + [
            'event_id' => $event->id, 'kind' => PassKind::Group, 'holder_name' => 'Ayu Pratiwi', 'people' => 4,
        ]);
    }

    public function test_the_qr_page_gets_everything_it_shows(): void
    {
        $pass = $this->pass();

        $this->getJson("/api/passes/{$pass->public_id}")
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJson([
                'kind' => 'group', 'holder_name' => 'Ayu Pratiwi', 'people' => 4, 'inside_count' => 0, 'status' => 'ready',
                'event' => ['date' => '2026-09-25', 'name' => 'Second Wave', 'opens_at' => '15:00', 'guestlist_cutoff' => '23:00'],
            ])
            ->assertJsonPath('entry_code', substr($pass->entry_code, 0, 4).'-'.substr($pass->entry_code, 4))
            ->assertJsonPath('qr', fn (string $qr) => str_starts_with($qr, 'FNG2.') && substr_count($qr, '.') === 2);
    }

    public function test_status_follows_the_door_and_the_clock(): void
    {
        $status = fn (Pass $pass) => $this->getJson("/api/passes/{$pass->public_id}")->json('status');

        $this->assertSame('partial', $status($this->pass(['inside_count' => 2])));
        $this->assertSame('used', $status($this->pass(['inside_count' => 4])));
        $this->assertSame('revoked', $status($this->pass(['inside_count' => 4, 'revoked_at' => now()])));

        $guestlist = $this->pass();
        $table = $this->pass(['kind' => PassKind::Table]);
        $this->travelTo('2026-09-25 23:00'); // guestlist cutoff
        $this->assertSame('expired', $status($guestlist));
        $this->assertSame('ready', $status($table));
        $this->travelTo('2026-09-26 04:00'); // close
        $this->assertSame('expired', $status($table));
    }

    public function test_an_unknown_pass_is_a_readable_404(): void
    {
        $this->getJson('/api/passes/01J00000000000000000000000')
            ->assertNotFound()
            ->assertExactJson(['message' => "We couldn't find that pass."]);
    }

    // T-P4, backend half: however the code is typed, it finds the one pass.
    public function test_an_entry_code_typed_any_way_finds_the_pass(): void
    {
        $pass = tap($this->pass())->update(['entry_code' => 'K70M4TXP']); // codes are generated on create

        foreach (['k70m 4txp', 'K70M-4TXP', 'K70M4TXP', 'K7OM4TXP', ' k7om - 4txp '] as $typed) {
            $this->assertSame($pass->id, Pass::withEntryCode($typed)->value('id'), $typed);
        }
    }

    public function test_only_staff_get_the_public_key(): void
    {
        $this->getJson('/api/door/public-key')->assertUnauthorized();

        foreach ([StaffRole::Door, StaffRole::Manager] as $role) {
            $this->actingAs(User::where('role', $role)->first())
                ->getJson('/api/door/public-key')
                ->assertOk()
                ->assertJson(['kty' => 'EC', 'crv' => 'P-256']);
        }
    }
}
