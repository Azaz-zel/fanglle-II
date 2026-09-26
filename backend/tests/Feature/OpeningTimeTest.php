<?php

namespace Tests\Feature;

use App\Enums\PassKind;
use App\Enums\StaffRole;
use App\Models\Event;
use App\Models\Pass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// B9.1 / F3: doors open at NIGHT_OPENS_AT, and every response that describes a night says so from config.
class OpeningTimeTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_night_response_reads_the_opening_time_from_config(): void
    {
        $this->useTestSigningKey();
        $this->travelTo('2026-09-25 20:00');
        $this->seed();
        config(['fanglle.night_opens_at' => '16:30']);

        $event = Event::firstWhere('date', '2026-09-25');
        $pass = Pass::create(['event_id' => $event->id, 'kind' => PassKind::Group, 'holder_name' => 'Ayu Pratiwi', 'people' => 2]);

        $this->getJson('/api/events/2026-09-25')->assertJsonPath('opens_at', '16:30');
        $this->getJson('/api/events')->assertJsonPath('events.0.opens_at', '16:30');
        $this->getJson("/api/passes/{$pass->public_id}")->assertJsonPath('event.opens_at', '16:30');

        $this->actingAs(User::firstWhere('role', StaffRole::Manager));
        $this->getJson('/api/admin/events/2026-09-25')->assertJsonPath('opens_at', '16:30');
        $this->getJson('/api/admin/tonight')->assertJsonPath('event.opens_at', '16:30')->assertJsonPath('arrivals.0.hour', '16:00');
        $this->putJson('/api/admin/events/2026-09-25', ['close_time' => '16:00'] + $this->getJson('/api/admin/events/2026-09-25')->json())
            ->assertJsonValidationErrors(['close_time' => 'Closing has to be after the 4:30 pm opening.']);
    }
}
