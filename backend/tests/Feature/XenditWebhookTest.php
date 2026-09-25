<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Mail\TableBooked;
use App\Models\Pass;
use App\Models\TableBooking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class XenditWebhookTest extends TestCase
{
    use RefreshDatabase;

    private TableBooking $booking;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-25 20:00');
        $this->seed();
        Mail::fake();
        Http::fake(['api.xendit.co/v2/invoices' => fn (HttpRequest $r) => Http::response(['id' => 'inv_'.$r['external_id'], 'invoice_url' => 'https://checkout-staging.xendit.co/x'])]);
        config(['services.xendit.callback_token' => 'callback-token']);

        $code = $this->postJson('/api/table-bookings', [
            'date' => '2026-09-25', 'table_code' => 'B5', 'party_size' => 7, 'name' => 'Made Wirawan',
            'phone' => '081234567890', 'email' => 'made@example.com', 'age_confirmed' => true,
        ])->assertCreated()->json('code');
        $this->booking = TableBooking::firstWhere('code', $code);
    }

    private function webhook(string $status, array $overrides = [], string $token = 'callback-token')
    {
        return $this->postJson('/api/webhooks/xendit', $overrides + [
            'id' => $this->booking->xendit_invoice_id, 'external_id' => $this->booking->code, 'status' => $status, 'amount' => 12000000,
        ], ['x-callback-token' => $token]);
    }

    private function counts(): array
    {
        return array_map(fn ($t) => DB::table($t)->count(), ['table_bookings' => 'table_bookings', 'passes' => 'passes', 'webhook_events' => 'webhook_events']);
    }

    // T-U3: nothing, not even a session or cache read, reaches the database before the token matches.
    public function test_a_wrong_token_is_403_before_any_query(): void
    {
        config(['session.driver' => 'database', 'cache.default' => 'database']);
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        $this->withHeader('Origin', 'http://localhost:5173'); // would start a session on a stateful route
        $this->webhook('PAID', token: 'wrong')->assertForbidden()->assertExactJson(['message' => 'Invalid callback token.']);
        $this->webhook('PAID', token: '')->assertForbidden();

        $this->assertSame([], $queries);
        $this->assertSame(BookingStatus::Held, $this->booking->fresh()->status);
    }

    public function test_an_unset_token_rejects_everything_even_an_empty_header(): void
    {
        config(['services.xendit.callback_token' => '']);

        $this->webhook('PAID', token: '')->assertForbidden();
        $this->assertSame(BookingStatus::Held, $this->booking->fresh()->status);
    }

    // T-U4
    public function test_invoice_and_external_id_must_both_match_and_nothing_is_created(): void
    {
        $before = $this->counts();

        $this->webhook('PAID', ['external_id' => 'F2-ZZZZ'])->assertNotFound();
        $this->webhook('PAID', ['id' => 'inv_someone_else'])->assertNotFound();
        $this->webhook('PAID', ['id' => 'inv_new', 'external_id' => 'F2-NEW1'])->assertNotFound();

        $this->assertSame($before, $this->counts());
        $this->assertSame(BookingStatus::Held, $this->booking->fresh()->status);
    }

    // T-U5
    public function test_paid_twice_makes_one_pass_and_one_email(): void
    {
        $this->webhook('PAID')->assertOk();
        $this->webhook('PAID')->assertOk();
        $this->webhook('SETTLED')->assertOk();

        $booking = $this->booking->fresh();
        $this->assertSame(BookingStatus::Paid, $booking->status);
        $this->assertNotNull($booking->paid_at);

        $pass = Pass::sole();
        $this->assertSame(['table', 7, 'Made Wirawan', $booking->id, $booking->event_id], [$pass->kind->value, $pass->people, $pass->holder_name, $pass->table_booking_id, $pass->event_id]);
        $this->assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{8}$/', $pass->entry_code);
        $this->assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{26}$/', $pass->public_id);

        Mail::assertQueued(TableBooked::class, 1);
        Mail::assertQueued(TableBooked::class, fn (TableBooked $mail) => $mail->hasTo('made@example.com') && $mail->pass->is($pass));
    }

    public function test_confirmation_email_has_the_pass_code_and_what_is_left_to_spend(): void
    {
        $this->webhook('PAID');
        $pass = Pass::sole();

        $mail = (new TableBooked($pass))->render();

        foreach (['Second Wave', 'Friday 25 September 2026', 'B5', config('app.url')."/p/{$pass->public_id}",
            substr($pass->entry_code, 0, 4).'-'.substr($pass->entry_code, 4), 'IDR 12,000,000', 'IDR 24,000,000', "isn't refunded if you cancel or don't come"] as $text) {
            $this->assertStringContainsString($text, $mail);
        }
        $this->assertStringNotContainsString('—', $mail);
        $this->assertSame('Your table B5 for Second Wave, Fri 25 Sep', (new TableBooked($pass))->envelope()->subject);
    }

    public function test_expired_releases_a_held_table(): void
    {
        $this->webhook('EXPIRED')->assertOk();

        $this->assertSame(BookingStatus::Released, $this->booking->fresh()->status);
        $this->assertSame(0, Pass::count());
    }

    public function test_statuses_after_the_fact_change_nothing(): void
    {
        $this->webhook('EXPIRED');
        $this->webhook('PAID')->assertOk();   // logged for a manual refund, never un-releases

        $this->assertSame(BookingStatus::Released, $this->booking->fresh()->status);
        $this->assertSame(0, Pass::count());
        Mail::assertNothingQueued();

        $this->webhook('PENDING')->assertOk();
        $this->webhook('PAID', ['id' => ['nested']])->assertUnprocessable();
    }

    // T-U7
    public function test_expire_command_releases_only_holds_that_ran_out_and_is_idempotent(): void
    {
        $this->artisan('bookings:expire')->expectsOutput('0 expired table holds released.')->assertSuccessful();
        $this->assertSame(BookingStatus::Held, $this->booking->fresh()->status);

        $this->travel(15)->minutes();
        $this->artisan('bookings:expire')->expectsOutput('1 expired table holds released.')->assertSuccessful();
        $this->artisan('bookings:expire')->expectsOutput('0 expired table holds released.')->assertSuccessful();
        $this->assertSame(BookingStatus::Released, $this->booking->fresh()->status);

        $this->webhook('EXPIRED')->assertOk();
        $this->assertSame(BookingStatus::Released, $this->booking->fresh()->status);
        $this->assertSame(1, DB::table('table_bookings')->count());
    }
}
