<?php

namespace Tests\Feature;

use App\Mail\GuestlistPasses;
use App\Models\Event;
use App\Models\GuestlistSignup;
use App\Models\Pass;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class GuestlistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-25 20:00'); // Friday evening; Second Wave's list closes at 23:00
        $this->seed();
        Mail::fake();
    }

    private function signUp(array $overrides = [])
    {
        return $this->postJson('/api/guestlist', $overrides + [
            'date' => '2026-09-25', 'party_size' => 4, 'qr_mode' => 'personal', 'name' => 'Ayu Pratiwi',
            'phone' => '+62 812-1111-2222', 'email' => 'ayu@example.com', 'guest_names' => ['Kadek Surya', 'Luh Sari', 'Putu Ananda'],
            'age_confirmed' => true,
        ]);
    }

    private function quota(int $quota): void
    {
        Event::where('date', '2026-09-25')->update(['guestlist_quota' => $quota]);
    }

    // T-G5
    public function test_personal_mode_makes_one_named_pass_each(): void
    {
        $response = $this->signUp()->assertCreated();

        $passes = Pass::orderBy('id')->get();
        $this->assertSame(['Ayu Pratiwi', 'Kadek Surya', 'Luh Sari', 'Putu Ananda'], $passes->pluck('holder_name')->all());
        $this->assertSame([1, 1, 1, 1], $passes->pluck('people')->all());
        $this->assertSame(['personal'], $passes->pluck('kind')->map->value->unique()->values()->all());
        $response->assertExactJson(['passes' => $passes->map(fn ($p) => ['holder_name' => $p->holder_name, 'pass_url' => "/p/{$p->public_id}"])->all()]);

        $signup = GuestlistSignup::sole();
        $this->assertSame(['+6281211112222', 4, 'personal'], [$signup->phone, $signup->party_size, $signup->qr_mode->value]);
    }

    // T-G5, T-G4 (group names are optional and not stored)
    public function test_group_mode_makes_one_pass_for_everyone_and_needs_no_names(): void
    {
        $this->signUp(['qr_mode' => 'group', 'guest_names' => []])->assertCreated()
            ->assertExactJson(['passes' => [['holder_name' => 'Ayu Pratiwi', 'pass_url' => '/p/'.Pass::sole()->public_id]]]);

        $pass = Pass::sole();
        $this->assertSame([4, 'group'], [$pass->people, $pass->kind->value]);
    }

    // T-G4
    public function test_personal_mode_needs_every_name(): void
    {
        $this->signUp(['guest_names' => ['Kadek Surya', 'Luh Sari']])->assertUnprocessable()
            ->assertJsonValidationErrors(['guest_names.2' => "Enter guest 4's name. Each QR carries one name."])
            ->assertJsonMissingValidationErrors(['guest_names.0', 'guest_names.1']);

        $this->signUp(['guest_names' => ['Kadek Surya', '', 'Putu Ananda']])->assertJsonValidationErrors('guest_names.1');
        $this->signUp(['party_size' => 1, 'guest_names' => []])->assertCreated();
        $this->assertSame(1, Pass::count());
    }

    public function test_form_errors_use_the_mockup_wording(): void
    {
        $this->postJson('/api/guestlist', ['date' => '2026-09-25', 'party_size' => 11, 'qr_mode' => 'group', 'phone' => '1', 'email' => 'x'])
            ->assertUnprocessable()->assertJsonValidationErrors([
                'party_size' => 'Choose between 1 and 10 people.',
                'name' => 'Enter your name as it appears on your ID.',
                'phone' => 'Enter your phone number. The door uses it to find you on the list.',
                'email' => 'Enter your email. Your QR is sent there.',
                'age_confirmed' => 'Everyone in the group must be 21 or over.',
            ]);
        $this->signUp(['date' => '2026-09-28'])->assertJsonValidationErrors(['date' => "There's no event on that night."]);
    }

    // T-G2
    public function test_a_group_bigger_than_the_places_left_is_422_with_places_left(): void
    {
        $this->quota(10);
        $this->signUp(['phone' => '081200000001', 'qr_mode' => 'group'])->assertCreated();

        $this->signUp(['phone' => '081200000002', 'party_size' => 8, 'qr_mode' => 'group'])->assertUnprocessable()->assertExactJson([
            'message' => 'Only 6 places left on Second Wave. Make your group smaller, or choose another night.',
            'errors' => ['party_size' => ['Only 6 places left on Second Wave. Make your group smaller, or choose another night.']],
            'places_left' => 6,
        ]);

        $this->signUp(['phone' => '081200000003', 'party_size' => 6, 'qr_mode' => 'group'])->assertCreated();
        $this->signUp(['phone' => '081200000004', 'party_size' => 1])->assertJsonPath('places_left', 0)
            ->assertJsonPath('message', 'The guestlist for Second Wave is full. Choose another night.');
    }

    // T-G3
    public function test_one_signup_per_number_per_night(): void
    {
        $this->signUp()->assertCreated();

        // One Indonesian number, three ways of typing it.
        foreach (['+62 812 1111 2222', '0812-1111-2222', '62 812 1111 2222', '812 1111 2222'] as $same) {
            $this->signUp(['phone' => $same, 'name' => 'Someone Else'])->assertStatus(409)
                ->assertExactJson(['message' => 'This number is already on the list for that night.']);
        }
        $this->signUp(['phone' => '+44 7700 900123', 'qr_mode' => 'group'])->assertCreated();
        $this->assertSame('+447700900123', GuestlistSignup::latest('id')->value('phone'));

        $this->signUp(['date' => '2026-09-26'])->assertCreated();

        GuestlistSignup::where('event_id', Event::where('date', '2026-09-25')->value('id'))->update(['removed_at' => now()]);
        $this->signUp()->assertCreated();
        $this->assertSame(4, GuestlistSignup::count()); // Ayu twice (one removed), the +44 guest, Ayu on Saturday
    }

    // T-G6
    public function test_signups_close_at_the_cutoff(): void
    {
        $this->travelTo('2026-09-25 22:59');
        $this->signUp(['phone' => '081200000001'])->assertCreated();

        $this->travelTo('2026-09-25 23:00');
        $this->signUp(['phone' => '081200000002'])->assertUnprocessable()
            ->assertJsonValidationErrors(['date' => 'The guestlist for Second Wave closed at 11 pm.']);
    }

    // T-G6, F2: a cutoff after midnight belongs to the same night
    public function test_a_cutoff_after_midnight_is_on_the_next_morning(): void
    {
        Event::where('date', '2026-09-25')->update(['guestlist_cutoff' => '00:30']);

        $this->travelTo('2026-09-26 00:15');
        $this->signUp(['phone' => '081200000001'])->assertCreated();

        $this->travelTo('2026-09-26 00:45');
        $this->signUp(['phone' => '081200000002'])->assertJsonValidationErrors(['date' => 'The guestlist for Second Wave closed at 12:30 am.']);
    }

    // T-G8
    public function test_turnstile_is_required_when_configured_and_skipped_when_not(): void
    {
        Http::fake(['challenges.cloudflare.com/*' => fn (HttpRequest $r) => Http::response(['success' => $r['response'] === 'good-token'])]);
        config(['services.turnstile.secret' => 'turnstile-secret']);

        $this->signUp()->assertUnprocessable()->assertJsonValidationErrors('turnstile_token');
        $this->postJson('/api/guestlist/resend', ['date' => '2026-09-25', 'phone' => '081200000001'])->assertJsonValidationErrors('turnstile_token');
        $this->signUp(['turnstile_token' => 'good-token'])->assertCreated();

        config(['services.turnstile.secret' => '']);
        $this->signUp(['phone' => '081200000009'])->assertCreated();
    }

    public function test_one_email_to_the_organiser_carries_every_qr_and_code(): void
    {
        $this->signUp()->assertCreated();

        Mail::assertQueued(GuestlistPasses::class, 1);
        Mail::assertQueued(GuestlistPasses::class, fn ($mail) => $mail->hasTo('ayu@example.com'));

        $html = (new GuestlistPasses(GuestlistSignup::sole()))->render();
        foreach (Pass::all() as $pass) {
            $this->assertStringContainsString($pass->holder_name, $html);
            $this->assertStringContainsString(config('app.url')."/p/{$pass->public_id}", $html);
            $this->assertStringContainsString(substr($pass->entry_code, 0, 4).'-'.substr($pass->entry_code, 4), $html);
        }
        $this->assertStringContainsString('free until 11 pm', $html);
        $this->assertStringNotContainsString('—', $html);
    }

    // T-G7, F13
    public function test_resend_goes_to_the_signup_email_three_times_an_hour(): void
    {
        $this->signUp()->assertCreated();
        $resend = fn () => $this->postJson('/api/guestlist/resend', ['date' => '2026-09-25', 'phone' => '+62 812 1111 2222', 'email' => 'thief@example.com']);

        foreach (range(1, 3) as $i) {
            $resend()->assertOk()->assertExactJson(['message' => 'We sent your QR again to the email you signed up with.']);
            $this->travel(10)->minutes();
        }
        $resend()->assertStatus(429)->assertExactJson(['message' => 'You can resend 3 times an hour. Try again later.']);

        Mail::assertQueued(GuestlistPasses::class, 4); // signup + 3 resends
        Mail::assertNotQueued(GuestlistPasses::class, fn ($mail) => $mail->hasTo('thief@example.com'));

        $this->travel(31)->minutes(); // an hour after the first resend
        $resend()->assertOk();
    }

    public function test_resend_for_a_number_not_on_the_list_is_404(): void
    {
        $this->signUp()->assertCreated();

        $this->postJson('/api/guestlist/resend', ['date' => '2026-09-26', 'phone' => '+6281211112222'])->assertNotFound()
            ->assertExactJson(['message' => "That number isn't on the list for that night."]);

        GuestlistSignup::query()->update(['removed_at' => now()]);
        $this->postJson('/api/guestlist/resend', ['date' => '2026-09-25', 'phone' => '+6281211112222'])->assertNotFound();
    }
}
