<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Sanctum only starts a session for requests from a first-party origin.
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    private function login(string $email, string $password = 'password')
    {
        return $this->postJson('/api/login', ['email' => $email, 'password' => $password]);
    }

    public function test_staff_sign_in_see_themselves_and_sign_out(): void
    {
        $user = User::factory()->create(['email' => 'm@thefanglle.example', 'role' => StaffRole::Manager]);
        $me = ['id' => $user->id, 'name' => $user->name, 'email' => 'm@thefanglle.example', 'role' => 'manager'];

        $this->login('m@thefanglle.example')->assertOk()->assertExactJson($me);
        $this->assertAuthenticatedAs($user);
        $this->getJson('/api/me')->assertOk()->assertExactJson($me);

        $this->postJson('/api/logout')->assertNoContent();
        $this->assertGuest('web');

        $this->app['auth']->forgetGuards(); // a real next request starts with fresh guards
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_wrong_password_and_unknown_email_get_the_same_422(): void
    {
        User::factory()->create(['email' => 'd@thefanglle.example']);

        $wrong = $this->login('d@thefanglle.example', 'nope')->assertUnprocessable()->assertJsonValidationErrors('email');
        $unknown = $this->login('nobody@thefanglle.example')->assertUnprocessable();

        $this->assertSame($wrong->json(), $unknown->json());
        $this->assertGuest();
    }

    public function test_disabled_account_is_403_only_with_the_right_password(): void
    {
        User::factory()->create(['email' => 'old@thefanglle.example', 'status' => StaffStatus::Disabled]);

        $this->login('old@thefanglle.example', 'nope')->assertUnprocessable();
        $this->login('old@thefanglle.example')->assertForbidden()->assertJsonStructure(['message']);
        $this->assertGuest();
    }

    public function test_invited_account_without_a_password_is_422(): void
    {
        User::factory()->create(['email' => 'new@thefanglle.example', 'status' => StaffStatus::Invited, 'password' => null]);

        $invited = $this->login('new@thefanglle.example')->assertUnprocessable();

        $this->assertSame($this->login('nobody@thefanglle.example')->json(), $invited->json());
        $this->assertGuest();
    }

    public function test_sixth_attempt_in_a_minute_is_429(): void
    {
        foreach (range(1, 5) as $i) {
            $this->login('x@thefanglle.example', 'nope')->assertUnprocessable();
        }

        $this->login('x@thefanglle.example', 'nope')->assertTooManyRequests()->assertJsonStructure(['message']);
    }

    public function test_me_without_a_session_is_401(): void
    {
        $this->getJson('/api/me')->assertUnauthorized()->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public function test_sign_in_without_a_browser_session_is_419_not_500(): void
    {
        $user = User::factory()->create(['email' => 'm@thefanglle.example']);

        $this->withoutHeader('Origin')
            ->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(419)
            ->assertExactJsonStructure(['message']);
        $this->assertGuest('web');
    }

    public function test_there_is_no_public_registration(): void
    {
        $this->postJson('/api/register', ['email' => 'a@b.c', 'password' => 'password'])
            ->assertNotFound()
            ->assertExactJsonStructure(['message']);
    }
}
