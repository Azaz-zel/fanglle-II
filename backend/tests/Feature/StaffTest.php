<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Mail\StaffInvite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class StaffTest extends TestCase
{
    use RefreshDatabase;

    private const LAST_MANAGER = 'Keep at least one active manager. Make someone else a manager first.';

    private const YOURSELF = "You can't change your own account. Ask another manager.";

    private const EXPIRED = 'This invite link has expired. Ask a manager for a new one.';

    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-26 14:00');
        $this->manager = User::factory()->create(['name' => 'Manager', 'email' => 'manager@thefanglle.example', 'role' => StaffRole::Manager]);
        Mail::fake();
    }

    private function asManager(): static
    {
        return $this->actingAs($this->manager);
    }

    /** Invites someone through the API and returns [their account, the raw token from the email]. */
    private function invite(string $email = 'new@thefanglle.example', string $role = 'door'): array
    {
        $id = $this->asManager()->postJson('/api/admin/staff', ['name' => 'New Person', 'email' => $email, 'role' => $role])
            ->assertCreated()->json('id');

        return [User::find($id), $this->lastToken()];
    }

    private function lastToken(): string
    {
        return Str::after(Mail::queued(StaffInvite::class)->last()->url, '/invite/');
    }

    private function accept(string $token, string $password = 'a long enough password')
    {
        return $this->postJson("/api/invites/{$token}/accept", ['password' => $password, 'password_confirmation' => $password]);
    }

    public function test_the_list_goes_active_invited_disabled_then_by_name_and_carries_no_secrets(): void
    {
        User::factory()->create(['name' => 'Zoe', 'status' => StaffStatus::Disabled]);
        User::factory()->create(['name' => 'Bram', 'status' => StaffStatus::Invited, 'password' => null, 'invite_token_hash' => hash('sha256', 'x')]);
        User::factory()->create(['name' => 'Ari', 'last_active_at' => now()]);

        $response = $this->asManager()->getJson('/api/admin/staff')->assertOk();

        $this->assertSame(['Ari', 'Manager', 'Bram', 'Zoe'], array_column($response->json('staff'), 'name'));
        $this->assertSame([false, true, false, false], array_column($response->json('staff'), 'you'));
        $this->assertSame(['id', 'name', 'email', 'role', 'status', 'last_active_at', 'invite_expires_at', 'you'], array_keys($response->json('staff.0')));
        $this->assertSame('2026-09-26T14:00:00+08:00', $response->json('staff.0.last_active_at'));
        $this->assertStringNotContainsString(hash('sha256', 'x'), $response->getContent());
    }

    public function test_invite_keeps_only_the_token_hash_and_emails_a_link_that_works_for_48_hours(): void
    {
        $this->asManager()->postJson('/api/admin/staff', ['name' => 'New Person', 'email' => 'new@thefanglle.example', 'role' => 'manager'])
            ->assertCreated()
            ->assertJson(['name' => 'New Person', 'email' => 'new@thefanglle.example', 'role' => 'manager', 'status' => 'invited',
                'last_active_at' => null, 'invite_expires_at' => '2026-09-28T14:00:00+08:00', 'you' => false]);

        $mail = Mail::queued(StaffInvite::class)->sole();
        $token = $this->lastToken();
        $this->assertTrue($mail->hasTo('new@thefanglle.example'));
        $this->assertSame(rtrim(config('app.url'), '/').'/invite/'.$token, $mail->url);
        $this->assertSame(40, strlen($token));

        $row = DB::table('users')->where('email', 'new@thefanglle.example')->first();
        $this->assertSame(hash('sha256', $token), $row->invite_token_hash);
        $this->assertNull($row->password);
        $this->assertStringNotContainsString($token, json_encode(DB::table('users')->get()));

        $html = $mail->render();
        $this->assertStringContainsString($mail->url, $html);
        $this->assertStringContainsString('Manager', $html);
        $this->assertStringContainsString('48 hours', $html);
        $this->assertStringNotContainsString('—', $html.$mail->envelope()->subject);
        $this->assertStringNotContainsString('&mdash;', $html);
    }

    public function test_the_queued_email_is_encrypted_so_the_raw_token_never_sits_in_the_jobs_table(): void
    {
        config(['queue.default' => 'database']);
        // Undo setUp's Mail::fake() (it replaced the container's mail.manager), so the email really goes onto the queue.
        $this->app->forgetInstance('mail.manager');
        Mail::clearResolvedInstances();

        $this->asManager()->postJson('/api/admin/staff', ['name' => 'New Person', 'email' => 'new@thefanglle.example', 'role' => 'door'])->assertCreated();

        $payload = DB::table('jobs')->sole()->payload;
        $token = Str::after(unserialize(decrypt(json_decode($payload)->data->command))->mailable->url, '/invite/');
        $this->assertSame(40, strlen($token));
        $this->assertStringNotContainsString($token, $payload);
        $this->assertSame(hash('sha256', $token), User::firstWhere('email', 'new@thefanglle.example')->invite_token_hash);
    }

    public function test_invite_errors_use_the_panel_wording(): void
    {
        $this->asManager()->postJson('/api/admin/staff', ['name' => ' ', 'email' => 'nope', 'role' => 'door'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name' => 'Add their name.', 'email' => 'Enter a valid email. The invite link goes there.']);

        $this->postJson('/api/admin/staff', ['name' => 'Twice', 'email' => 'MANAGER@thefanglle.example', 'role' => 'door'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'That email already has an account.']);

        Mail::assertNothingQueued();
    }

    // T-A5
    public function test_accepting_sets_the_password_and_a_second_use_is_410(): void
    {
        [$staff, $token] = $this->invite(role: 'manager');

        $this->accept($token, 'too short')->assertUnprocessable()->assertJsonValidationErrors(['password' => 'Use at least 10 characters.']);
        $this->postJson("/api/invites/{$token}/accept", ['password' => 'a long enough password', 'password_confirmation' => 'another one'])
            ->assertUnprocessable()->assertJsonValidationErrors(['password' => "The two passwords don't match."]);

        $this->accept($token)->assertOk()->assertExactJson(['email' => 'new@thefanglle.example', 'role' => 'manager']);
        $this->assertSame(StaffStatus::Active, $staff->fresh()->status);
        $this->assertTrue(Hash::check('a long enough password', $staff->fresh()->password));

        $this->accept($token, 'somebody else now')->assertStatus(410)->assertExactJson(['message' => self::EXPIRED]);
        $this->assertTrue(Hash::check('a long enough password', $staff->fresh()->password));
    }

    // T-A5
    public function test_a_link_older_than_48_hours_is_410_and_a_made_up_one_is_404(): void
    {
        [$staff, $token] = $this->invite();

        $this->travel(48 * 60 + 1)->minutes();
        $this->accept($token)->assertStatus(410)->assertExactJson(['message' => self::EXPIRED]);
        $this->assertSame(StaffStatus::Invited, $staff->fresh()->status);

        $this->accept(Str::random(40))->assertNotFound()->assertExactJson(['message' => "This invite link isn't valid."]);
    }

    public function test_resending_replaces_the_old_link(): void
    {
        [$staff, $old] = $this->invite();

        $this->travel(47)->hours();
        $this->asManager()->postJson("/api/admin/staff/{$staff->id}/resend-invite")
            ->assertOk()->assertJson(['status' => 'invited', 'invite_expires_at' => '2026-09-30T13:00:00+08:00']);
        $new = $this->lastToken();

        $this->assertNotSame($old, $new);
        $this->accept($old)->assertNotFound();
        $this->accept($new)->assertOk();

        $this->asManager()->postJson("/api/admin/staff/{$staff->id}/resend-invite")
            ->assertUnprocessable()->assertExactJson(['message' => 'This invite has already been accepted.']);
    }

    public function test_only_a_pending_invite_can_be_cancelled(): void
    {
        [$staff, $token] = $this->invite();
        $door = User::factory()->create();

        $this->asManager()->deleteJson("/api/admin/staff/{$door->id}/invite")->assertUnprocessable();
        $this->assertModelExists($door);

        $this->deleteJson("/api/admin/staff/{$staff->id}/invite")->assertNoContent();
        $this->assertModelMissing($staff);
        $this->accept($token)->assertNotFound();
        $this->deleteJson("/api/admin/staff/{$staff->id}/invite")->assertNotFound()->assertExactJson(['message' => "We couldn't find that account."]);
    }

    public function test_role_change_disable_and_enable(): void
    {
        $door = User::factory()->create();

        $this->asManager()->patchJson("/api/admin/staff/{$door->id}", ['role' => 'manager'])->assertOk()->assertJson(['role' => 'manager']);
        $this->patchJson("/api/admin/staff/{$door->id}", ['role' => 'boss'])->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->postJson("/api/admin/staff/{$door->id}/disable")->assertOk()->assertJson(['status' => 'disabled']);
        $this->postJson("/api/admin/staff/{$door->id}/disable")->assertUnprocessable();
        $this->postJson("/api/admin/staff/{$door->id}/enable")->assertOk()->assertJson(['status' => 'active']);

        [$invited] = $this->invite();
        $this->asManager()->postJson("/api/admin/staff/{$invited->id}/enable")
            ->assertUnprocessable()->assertExactJson(['message' => 'Only a disabled account can be enabled.']);
    }

    // T-A3: through the panel the last manager can only be yourself (T-A4), so this is the one other way: two managers
    // removing each other at once. The second request was already signed in as a manager when the first one landed.
    public function test_the_last_active_manager_cannot_be_disabled_or_made_door_staff(): void
    {
        $other = User::factory()->create(['role' => StaffRole::Manager]);

        $this->actingAs($other)->patchJson("/api/admin/staff/{$this->manager->id}", ['role' => 'door'])->assertOk();

        $this->asManager()->postJson("/api/admin/staff/{$other->id}/disable")
            ->assertUnprocessable()->assertExactJson(['message' => self::LAST_MANAGER]);
        $this->patchJson("/api/admin/staff/{$other->id}", ['role' => 'door'])
            ->assertUnprocessable()->assertExactJson(['message' => self::LAST_MANAGER]);

        $this->assertSame([StaffRole::Manager, StaffStatus::Active], [$other->fresh()->role, $other->fresh()->status]);
    }

    // T-A4
    public function test_a_manager_cannot_disable_demote_or_reset_themselves(): void
    {
        User::factory()->create(['role' => StaffRole::Manager]); // so "last manager" is not what stops it
        $me = $this->manager->id;

        $this->asManager()->postJson("/api/admin/staff/{$me}/disable")->assertUnprocessable()->assertExactJson(['message' => self::YOURSELF]);
        $this->patchJson("/api/admin/staff/{$me}", ['role' => 'door'])->assertUnprocessable()->assertExactJson(['message' => self::YOURSELF]);
        $this->postJson("/api/admin/staff/{$me}/reset-password")->assertUnprocessable()->assertExactJson(['message' => self::YOURSELF]);

        $this->assertSame([StaffRole::Manager, StaffStatus::Active], [$this->manager->fresh()->role, $this->manager->fresh()->status]);
        $this->assertNotNull($this->manager->fresh()->password);
    }

    public function test_reset_password_signs_them_out_and_they_set_a_new_one_from_the_email(): void
    {
        $door = User::factory()->create(['email' => 'door@thefanglle.example']);
        DB::table('sessions')->insert(['id' => 'door-phone', 'user_id' => $door->id, 'payload' => '', 'last_activity' => now()->timestamp]);

        $this->asManager()->postJson("/api/admin/staff/{$door->id}/reset-password")->assertOk()->assertJson(['status' => 'active']);

        $this->assertNull($door->fresh()->password);
        $this->assertDatabaseMissing('sessions', ['user_id' => $door->id]);
        $mail = Mail::queued(StaffInvite::class)->sole();
        $this->assertTrue($mail->reset && $mail->hasTo('door@thefanglle.example'));
        $this->assertStringContainsString($mail->url, $html = $mail->render());
        $this->assertStringNotContainsString('—', $html.$mail->envelope()->subject);

        $this->accept($this->lastToken(), 'my new door password')->assertOk()->assertExactJson(['email' => 'door@thefanglle.example', 'role' => 'door']);
        $this->assertTrue(Hash::check('my new door password', $door->fresh()->password));

        $this->asManager()->postJson("/api/admin/staff/{$door->id}/reset-password")->assertOk();
        $this->postJson("/api/admin/staff/{$door->id}/disable")->assertOk();
        $this->accept($this->lastToken())->assertStatus(410); // an old reset link doesn't bring a disabled account back
        $this->assertSame(StaffStatus::Disabled, $door->fresh()->status);
    }

    // T-A6: a real session in the database, sent back with the same cookie.
    public function test_disabling_ends_their_sessions_at_once(): void
    {
        config(['session.driver' => 'database']);
        $door = User::factory()->create(['email' => 'door@thefanglle.example']);
        $cookie = config('session.cookie');
        $origin = ['Origin' => 'http://localhost:5173'];

        $session = $this->withHeaders($origin)->postJson('/api/login', ['email' => 'door@thefanglle.example', 'password' => 'password'])
            ->assertOk()->getCookie($cookie)->getValue();
        $this->assertDatabaseHas('sessions', ['user_id' => $door->id]);
        $this->assertNotNull($door->fresh()->last_active_at);

        $this->nextRequest();
        $this->withHeaders($origin)->withCookie($cookie, $session)->getJson('/api/me')->assertOk()->assertJson(['email' => 'door@thefanglle.example']);

        $this->nextRequest();
        $this->withoutHeader('Origin')->actingAs($this->manager)->postJson("/api/admin/staff/{$door->id}/disable")->assertOk();
        $this->assertDatabaseMissing('sessions', ['user_id' => $door->id]);

        $this->nextRequest();
        $this->withHeaders($origin)->withCookie($cookie, $session)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_a_disabled_account_that_still_holds_a_session_gets_401(): void
    {
        $this->actingAs(User::factory()->create(['status' => StaffStatus::Disabled]))
            ->getJson('/api/door/public-key')->assertUnauthorized()->assertExactJson(['message' => 'Unauthenticated.']);
    }

    /** The test app lives across requests; a browser's next request starts with nothing in memory. */
    private function nextRequest(): void
    {
        $this->app['auth']->forgetGuards();
        $this->app->forgetInstance('auth.driver');
        $this->app['session']->forgetDrivers();
    }
}
