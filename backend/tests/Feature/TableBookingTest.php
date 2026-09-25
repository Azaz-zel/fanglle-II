<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Mail\TableBooked;
use App\Models\Pass;
use App\Models\TableBooking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TableBookingTest extends TestCase
{
    use RefreshDatabase;

    // What the fake Xendit answers; tests change these. (Http::fake stubs can't be replaced, only added.)
    private int $createStatus = 200;

    private int $expireStatus = 200;

    private string $invoiceStatus = 'PENDING';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-25 20:00'); // Friday night, Second Wave
        $this->seed();
        Mail::fake();
        Http::fake([
            'api.xendit.co/v2/invoices' => fn (HttpRequest $r) => $this->createStatus === 200
                ? Http::response(['id' => 'inv_'.$r['external_id'], 'invoice_url' => 'https://checkout-staging.xendit.co/web/inv_'.$r['external_id'], 'status' => 'PENDING'])
                : Http::response(['error_code' => 'SERVER_ERROR'], $this->createStatus),
            'api.xendit.co/v2/invoices/*' => fn () => Http::response(['status' => $this->invoiceStatus]),
            'api.xendit.co/invoices/*/expire!' => fn () => $this->expireStatus === 200
                ? Http::response(['status' => 'EXPIRED'])
                : Http::response(['error_code' => 'INVOICE_NOT_EXPIRABLE'], $this->expireStatus),
            'challenges.cloudflare.com/*' => fn (HttpRequest $r) => Http::response(['success' => $r['response'] === 'good-token']),
        ]);
    }

    private function hold(array $overrides = [])
    {
        return $this->postJson('/api/table-bookings', $overrides + [
            'date' => '2026-09-25', 'table_code' => 'B5', 'party_size' => 7, 'name' => 'Made Wirawan',
            'phone' => '+62 812-3456-7890', 'email' => 'made@example.com', 'age_confirmed' => true,
        ]);
    }

    private function tableStatus(string $code): string
    {
        return collect($this->getJson('/api/events/2026-09-25/tables')->json('tables'))->firstWhere('code', $code)['status'];
    }

    public function test_holding_a_table_creates_a_14_minute_invoice_for_half_the_minimum_spend(): void
    {
        $response = $this->hold()->assertCreated();
        $booking = TableBooking::firstWhere('code', $response->json('code'));

        $response->assertExactJson([
            'code' => $booking->code, 'secret' => $booking->secret(), 'held_until' => '2026-09-25T20:15:00+08:00',
            'deposit' => 12000000, 'min_spend' => 24000000, 'payment_url' => 'https://checkout-staging.xendit.co/web/inv_'.$booking->code,
        ]);
        $this->assertMatchesRegularExpression('/^F2-[0-9A-HJKMNP-TV-Z]{4}$/', $booking->code);
        $this->assertSame('+6281234567890', $booking->phone);

        // T-U6
        $this->assertSame(900, (int) $booking->created_at->diffInSeconds($booking->held_until));
        Http::assertSent(fn (HttpRequest $r) => $r->url() === 'https://api.xendit.co/v2/invoices'
            && $r['invoice_duration'] === 840 && $r['amount'] === 12000000 && $r['currency'] === 'IDR'
            && $r['external_id'] === $booking->code && $r['customer']['email'] === 'made@example.com'
            && $r['success_redirect_url'] === config('app.url')."/booking/{$booking->code}?k={$booking->secret()}"
            && $r->hasHeader('Authorization', 'Basic '.base64_encode('xnd_development_test:')));

        $this->assertSame('held', $this->tableStatus('B5'));
    }

    public function test_a_held_table_is_409(): void
    {
        $this->hold()->assertCreated();

        $this->hold(['phone' => '081200000000'])->assertStatus(409)->assertExactJson(['message' => 'That table was just taken.']);
    }

    // T-U2
    public function test_a_released_booking_does_not_block_the_table(): void
    {
        $first = $this->hold()->json();
        $this->postJson("/api/table-bookings/{$first['code']}/release?k={$first['secret']}")->assertOk();

        $this->hold()->assertCreated();
        $this->assertSame(2, TableBooking::count());
    }

    public function test_an_expired_hold_not_yet_released_does_not_block_the_table(): void
    {
        $this->hold()->assertCreated();
        $this->travel(16)->minutes();

        $this->assertSame('free', $this->tableStatus('B5'));
        $this->hold()->assertCreated();
        $this->assertSame(['released', 'held'], TableBooking::orderBy('id')->pluck('status')->map->value->all());
    }

    public function test_party_bigger_than_the_table_is_422(): void
    {
        $this->hold(['party_size' => 13])->assertUnprocessable()
            ->assertJsonValidationErrors(['party_size' => 'B5 seats 12. Choose a bigger table or a smaller group.']);
    }

    public function test_form_errors_use_the_mockup_wording(): void
    {
        $this->postJson('/api/table-bookings', ['date' => '2026-09-25', 'table_code' => 'B5', 'party_size' => 2, 'phone' => '12', 'email' => 'nope'])
            ->assertUnprocessable()->assertJsonValidationErrors([
                'name' => 'Enter the name for the booking.',
                'phone' => 'Enter your phone number. The door uses it to find your booking.',
                'email' => 'Enter your email. Your QR is sent there.',
                'age_confirmed' => 'Everyone in the group must be 21 or over.',
            ]);
        $this->hold(['table_code' => 'Z9'])->assertJsonValidationErrors('table_code');
        Http::assertNothingSent();
    }

    public function test_bookings_close_when_the_night_ends(): void
    {
        $this->hold(['date' => '2026-09-28'])->assertJsonValidationErrors(['date' => "There's no event on that night."]);

        $this->travelTo('2026-09-26 03:59');
        $this->hold()->assertCreated();

        $this->travelTo('2026-09-26 04:00');
        $this->hold(['table_code' => 'S1', 'party_size' => 2])->assertJsonValidationErrors(['date' => 'Bookings for that night have closed.']);
    }

    // T-U8
    public function test_xendit_failing_releases_the_table_and_is_502(): void
    {
        $this->createStatus = 500;

        $this->hold()->assertStatus(502)->assertExactJson(['message' => "Payment couldn't start. Please try again."]);

        $this->assertSame(BookingStatus::Released, TableBooking::first()->status);
        $this->assertSame('free', $this->tableStatus('B5'));
    }

    public function test_turnstile_is_required_when_configured_and_skipped_when_not(): void
    {
        config(['services.turnstile.secret' => 'turnstile-secret']);

        $this->hold()->assertUnprocessable()->assertJsonValidationErrors('turnstile_token');
        $this->hold(['turnstile_token' => 'bad-token'])->assertJsonValidationErrors('turnstile_token');
        Http::assertSent(fn (HttpRequest $r) => str_contains($r->url(), 'siteverify') && $r['secret'] === 'turnstile-secret');

        $this->hold(['turnstile_token' => 'good-token'])->assertCreated();

        config(['services.turnstile.secret' => '']);
        $this->hold(['table_code' => 'S1', 'party_size' => 2])->assertCreated();
    }

    public function test_floor_plan_shows_booked_held_and_free(): void
    {
        $paid = $this->hold()->json('code');
        TableBooking::firstWhere('code', $paid)->applyInvoiceStatus('PAID');
        $this->hold(['table_code' => 'S2', 'party_size' => 2])->assertCreated();

        $tables = $this->getJson('/api/events/2026-09-25/tables')->assertOk()->json('tables');

        $this->assertCount(16, $tables);
        $this->assertSame(['code' => 'B5', 'zone' => 'booth', 'shape' => 'booth', 'capacity' => 12, 'x' => 928, 'y' => 265, 'status' => 'booked'], $tables[8]);
        $this->assertEquals(['booked' => 1, 'held' => 1, 'free' => 14], collect($tables)->countBy('status')->all());
        $this->getJson('/api/events/2026-09-29/tables')->assertNotFound()->assertExactJson(['message' => "There's no event on that night."]);
    }

    public function test_status_needs_the_right_secret(): void
    {
        $booking = $this->hold()->json();

        foreach (["?k=wrong{$booking['secret']}", '?k=', '', '?k[]=x'] as $query) {
            $this->getJson("/api/table-bookings/{$booking['code']}{$query}")->assertNotFound()->assertExactJson(['message' => "We couldn't find that booking."]);
        }
        $this->getJson("/api/table-bookings/F2-ZZZZ?k={$booking['secret']}")->assertNotFound()->assertExactJson(['message' => "We couldn't find that booking."]);
        $this->postJson("/api/table-bookings/{$booking['code']}/release?k=wrong")->assertNotFound();
    }

    public function test_polling_picks_up_a_payment_the_webhook_missed_but_asks_xendit_at_most_every_10_seconds(): void
    {
        $booking = $this->hold()->json();
        $status = "/api/table-bookings/{$booking['code']}?k={$booking['secret']}";

        $this->getJson($status)->assertOk()->assertExactJson(['status' => 'held', 'held_until' => '2026-09-25T20:15:00+08:00', 'pass_url' => null]);

        $this->invoiceStatus = 'PAID';
        $this->getJson($status)->assertJsonPath('status', 'held'); // within 10 s of the last look: no call
        Http::assertSentCount(2);                                   // create + one status read

        $this->travel(11)->seconds();
        $this->getJson($status)->assertOk()->assertJsonPath('status', 'paid');
        $pass = Pass::sole();
        $this->getJson($status)->assertJsonPath('pass_url', "/p/{$pass->public_id}");
        Http::assertSentCount(3);
        Mail::assertQueued(TableBooked::class, 1);
    }

    public function test_polling_an_expired_hold_releases_it_on_the_spot(): void
    {
        $booking = $this->hold()->json();
        $this->travel(15)->minutes();

        $this->getJson("/api/table-bookings/{$booking['code']}?k={$booking['secret']}")->assertJsonPath('status', 'released');
        Http::assertSentCount(1);
    }

    public function test_guest_release_expires_the_invoice_first_and_frees_the_table(): void
    {
        $booking = $this->hold()->json();
        $release = "/api/table-bookings/{$booking['code']}/release?k={$booking['secret']}";

        $this->postJson($release)->assertOk()->assertExactJson(['status' => 'released']);
        $this->postJson($release)->assertOk()->assertExactJson(['status' => 'released']);

        $this->assertSame('free', $this->tableStatus('B5'));
        $expires = fn (HttpRequest $r) => $r->method() === 'POST' && $r->url() === "https://api.xendit.co/invoices/inv_{$booking['code']}/expire!";
        Http::assertSentCount(2); // create + a single expire
        Http::assertSent($expires);
    }

    public function test_release_keeps_the_table_when_xendit_cannot_expire_the_invoice(): void
    {
        $booking = $this->hold()->json();
        $this->expireStatus = 503;

        $this->postJson("/api/table-bookings/{$booking['code']}/release?k={$booking['secret']}")
            ->assertStatus(502)->assertExactJson(['message' => "Couldn't cancel the payment. Please try again."]);

        $this->assertSame(BookingStatus::Held, TableBooking::first()->status);
        $this->assertSame('held', $this->tableStatus('B5'));
    }

    public function test_release_of_an_invoice_paid_meanwhile_records_the_payment_and_is_409(): void
    {
        $booking = $this->hold()->json();
        $this->expireStatus = 400;
        $this->invoiceStatus = 'PAID';

        $this->postJson("/api/table-bookings/{$booking['code']}/release?k={$booking['secret']}")
            ->assertStatus(409)->assertExactJson(['message' => "This table is already paid. Deposits aren't refunded."]);

        $this->assertSame(BookingStatus::Paid, TableBooking::first()->status);
        $this->assertSame(1, Pass::count());
    }

    public function test_a_paid_table_cannot_be_released(): void
    {
        $booking = $this->hold()->json();
        TableBooking::first()->applyInvoiceStatus('PAID');

        $this->postJson("/api/table-bookings/{$booking['code']}/release?k={$booking['secret']}")
            ->assertStatus(409)->assertExactJson(['message' => "This table is already paid. Deposits aren't refunded."]);
        Http::assertSentCount(1);
    }
}
