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
use App\Support\Night;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminOperationsTest extends TestCase
{
    use RefreshDatabase;

    private const NIGHT = '2026-09-25'; // Friday, Second Wave: doors 15:00, list closes 23:00, close 04:00

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-26 01:30'); // still Friday's night (F2)
        $this->seed();
        Mail::fake();
        Http::preventStrayRequests();
        Http::fake(['api.xendit.co/invoices/*/expire!' => Http::response(['status' => 'EXPIRED'])]);
    }

    /** Every test number shares the middle digits 812999, so a full number is easy to spot in a response. */
    private static function phone(string $last4): string
    {
        return '+62812999'.$last4;
    }

    private function event(): Event
    {
        return Event::firstWhere('date', self::NIGHT);
    }

    private function asManager(): static
    {
        return $this->actingAs(User::firstWhere('role', StaffRole::Manager));
    }

    private function booking(string $code, string $table, BookingStatus $status, array $attributes = []): TableBooking
    {
        $booking = TableBooking::create($attributes + [
            'code' => $code, 'event_id' => $this->event()->id, 'venue_table_id' => VenueTable::where('code', $table)->value('id'),
            'status' => $status, 'name' => 'Made Wirawan', 'phone' => self::phone('4410'), 'email' => 'made@example.com',
            'party_size' => 6, 'min_spend' => 24000000, 'deposit' => 12000000, 'held_until' => now()->addMinutes(6),
            'paid_at' => in_array($status, [BookingStatus::Paid, BookingStatus::NoShow], true) ? now() : null,
        ]);
        if ($booking->paid_at) {
            $booking->pass()->create([
                'event_id' => $booking->event_id, 'kind' => PassKind::Table, 'holder_name' => $booking->name, 'people' => $booking->party_size,
                'revoked_at' => $status === BookingStatus::NoShow ? now() : null,
            ]);
        }

        return $booking;
    }

    private function signup(string $name, string $last4, int $people, QrMode $mode = QrMode::Group, array $guests = []): GuestlistSignup
    {
        $signup = GuestlistSignup::create([
            'event_id' => $this->event()->id, 'name' => $name, 'phone' => self::phone($last4), 'email' => 'guest@example.com',
            'party_size' => $people, 'qr_mode' => $mode,
        ]);
        $holders = $mode === QrMode::Group ? [[$name, $people]] : array_map(fn ($holder) => [$holder, 1], [$name, ...$guests]);
        foreach ($holders as [$holder, $count]) {
            $signup->passes()->create(['event_id' => $signup->event_id, 'kind' => PassKind::from($mode->value), 'holder_name' => $holder, 'people' => $count]);
        }

        return $signup;
    }

    /** A real door check-in (S6), at a night-time of NIGHT. */
    private function arrive(Pass $pass, int $count, string $time, CheckInMethod $method = CheckInMethod::Scan): void
    {
        CheckIn::record(User::firstWhere('role', $method === CheckInMethod::Override ? StaffRole::Manager : StaffRole::Door), [
            'client_uuid' => (string) Str::uuid(), 'public_id' => $pass->public_id, 'count' => $count, 'method' => $method->value,
            'scanned_at' => Night::at(self::NIGHT, $time)->toIso8601String(),
        ]);
    }

    // T-A1: the role is checked before anything is looked up, so made-up codes and dates are 403 too.
    public function test_door_staff_are_refused_on_every_admin_route(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes())->filter(fn ($route) => str_starts_with($route->uri(), 'api/admin/'));
        $this->assertGreaterThanOrEqual(19, $routes->count()); // S7 operations and S8 team

        $this->actingAs(User::firstWhere('role', StaffRole::Door));
        foreach ($routes as $route) {
            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $this->json($method, '/'.preg_replace('/\{[^}]+\}/', 'x', $route->uri()))
                    ->assertForbidden()->assertExactJson(['message' => 'Only managers can do this.']);
            }
        }
    }

    // T-A7
    public function test_no_admin_list_ever_carries_a_full_phone_number(): void
    {
        $this->booking('F2-1CVB', 'S1', BookingStatus::Paid, ['phone' => self::phone('2291')]);
        $this->booking('F2-4LWX', 'S3', BookingStatus::Held, ['phone' => self::phone('1156')]);
        $made = $this->booking('F2-7K4Q', 'B5', BookingStatus::Paid);
        $this->arrive($made->pass, 3, '22:40');
        $ayu = $this->signup('Ayu Pratiwi', '1234', 4);
        $this->arrive($ayu->passes[0], 2, '23:12', CheckInMethod::Override);
        $this->signup('Nengah Budi', '5170', 2, QrMode::Personal, ['Kadek Surya']);

        $this->asManager();
        foreach (['tonight', 'events/'.self::NIGHT.'/table-bookings', 'events/'.self::NIGHT.'/guestlist', 'events/'.self::NIGHT.'/check-ins'] as $list) {
            $raw = $this->getJson('/api/admin/'.$list)->assertOk()->getContent();
            $this->assertStringNotContainsString('812999', $raw, $list);
            $this->assertStringNotContainsString('+62', $raw, $list);
        }
        $this->assertSame(['2291', '1156', '4410'], collect($this->getJson('/api/admin/events/'.self::NIGHT.'/table-bookings')->json('bookings'))
            ->sortBy('code')->pluck('phone_last4')->all());
        $this->assertSame(['1234', '5170'], $this->getJson('/api/admin/events/'.self::NIGHT.'/guestlist')->json('signups.*.phone_last4'));
    }

    public function test_tonight_counts_the_people_inside_tables_deposits_and_arrivals_in_night_order(): void
    {
        $gede = $this->booking('F2-9QRT', 'B1', BookingStatus::Paid, ['name' => 'Gede Pramana']);
        $this->booking('F2-2PZM', 'B2', BookingStatus::Paid, ['name' => 'Wayan Dharma', 'party_size' => 10]);
        $this->booking('F2-4LWX', 'S3', BookingStatus::Held, ['name' => 'Komang Adi', 'deposit' => 8000000]);
        $this->booking('F2-OLD1', 'T4', BookingStatus::Held, ['held_until' => now()->subMinute()]); // ran out, not yet released
        $this->booking('F2-8HJN', 'T5', BookingStatus::Released, ['deposit' => 4000000]);
        $this->arrive($gede->pass, 6, '22:09');

        $ayu = $this->signup('Ayu Pratiwi', '1234', 4);
        $putu = $this->signup('Putu Ananda', '0937', 2);
        $luh = $this->signup('Luh Sari', '3319', 1, QrMode::Personal);
        $this->signup('Dewi Lestari', '4482', 6);
        $this->signup('Rina', '7777', 3)->update(['removed_at' => now()]);
        $this->arrive($putu->passes[0], 2, '22:14');
        $this->arrive($ayu->passes[0], 2, '23:12', CheckInMethod::Override);
        $this->arrive($luh->passes[0], 1, '00:20');

        $tonight = $this->asManager()->getJson('/api/admin/tonight')->assertOk();

        $tonight->assertJsonPath('event.date', self::NIGHT)
            ->assertJsonPath('event.name', 'Second Wave')
            ->assertJsonPath('event.opens_at', '15:00')
            ->assertJsonPath('event.close_time', '04:00')
            ->assertJsonPath('event.guestlist_cutoff', '23:00')
            ->assertJsonCount(5, 'event.lineup')
            ->assertJsonPath('capacity', 600)
            ->assertJsonPath('inside', 11)
            ->assertJsonPath('guestlist', ['signed' => 13, 'quota' => 200, 'arrived' => 5])
            ->assertJsonPath('tables', ['total' => 16, 'booked' => 2, 'to_arrive' => 1])
            ->assertJsonPath('deposits', 24000000)
            ->assertJsonPath('held', [['code' => 'F2-4LWX', 'table_code' => 'S3', 'name' => 'Komang Adi', 'held_until' => now()->addMinutes(6)->toIso8601String()]])
            ->assertJsonPath('overrides', ['count' => 1, 'latest' => ['holder_name' => 'Ayu Pratiwi', 'count' => 2, 'scanned_at' => '2026-09-25T23:12:00+08:00']]);

        $arrivals = collect($tonight->json('arrivals'));
        $this->assertSame(['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00'], $arrivals->pluck('hour')->all());
        $this->assertSame(['hour' => '22:00', 'total' => 8, 'guestlist' => 2, 'tables' => 6], $arrivals[7]);
        $this->assertSame(['hour' => '23:00', 'total' => 2, 'guestlist' => 2, 'tables' => 0], $arrivals[8]);
        $this->assertSame(['hour' => '00:00', 'total' => 1, 'guestlist' => 1, 'tables' => 0], $arrivals[9]);
        $this->assertSame(11, $arrivals->sum('total'));
    }

    public function test_tonight_without_an_event_is_null(): void
    {
        $this->travelTo('2026-09-29 20:00'); // a Tuesday

        $this->asManager()->getJson('/api/admin/tonight')->assertOk()->assertExactJson(['event' => null]);
    }

    public function test_table_bookings_most_urgent_first_with_status_and_search_filters(): void
    {
        $this->booking('F2-1CVB', 'S1', BookingStatus::Paid, ['name' => 'Sang Ayu', 'phone' => self::phone('2291')]);
        $this->booking('F2-2PZM', 'B2', BookingStatus::Paid, ['name' => 'Wayan Dharma', 'phone' => self::phone('7702')]);
        $made = $this->booking('F2-7K4Q', 'B5', BookingStatus::Paid, ['name' => 'Made Wirawan', 'party_size' => 7]);
        $this->booking('F2-8HJN', 'T4', BookingStatus::Released, ['name' => 'Ketut Rai', 'phone' => self::phone('6604')]);
        $this->booking('F2-3NSX', 'B3', BookingStatus::NoShow, ['name' => 'Gede Pramana', 'phone' => self::phone('3380')]);
        $this->booking('F2-OLD1', 'T6', BookingStatus::Held, ['name' => 'Late Payer', 'phone' => self::phone('9001'), 'held_until' => now()->subMinute()]);
        $this->booking('F2-4LWX', 'S3', BookingStatus::Held, ['name' => 'Komang Adi', 'phone' => self::phone('1156')]);
        $this->arrive($made->pass, 3, '22:40');
        $list = fn (string $query = '') => $this->getJson('/api/admin/events/'.self::NIGHT.'/table-bookings'.$query)->assertOk();
        $this->asManager();

        $all = $list();
        $this->assertSame(
            ['F2-4LWX', 'F2-2PZM', 'F2-1CVB', 'F2-7K4Q', 'F2-OLD1', 'F2-8HJN', 'F2-3NSX'], // held, paid (newest first), arrived, released, no-show
            $all->json('bookings.*.code'),
        );
        $all->assertJsonPath('bookings.4.status', 'released') // a hold that ran out is released on the spot
            ->assertJsonPath('counts', ['held' => 1, 'paid' => 2, 'arrived' => 1, 'released' => 2, 'no_show' => 1])
            ->assertJsonPath('bookings.3', [
                'code' => 'F2-7K4Q', 'status' => 'arrived', 'table_code' => 'B5', 'zone' => 'booth', 'name' => 'Made Wirawan', 'phone_last4' => '4410',
                'party_size' => 7, 'inside_count' => 3, 'deposit' => 12000000, 'min_spend' => 24000000,
                'held_until' => $made->held_until->toIso8601String(), 'paid_at' => $made->paid_at->toIso8601String(),
                'created_at' => $made->created_at->toIso8601String(), 'updated_at' => $made->updated_at->toIso8601String(),
                'check_ins' => [['scanned_at' => '2026-09-25T22:40:00+08:00', 'count' => 3, 'method' => 'scan']],
            ]);

        $this->assertSame(['F2-2PZM', 'F2-1CVB'], $list('?status=paid')->json('bookings.*.code'));
        $this->assertSame(['F2-7K4Q'], $list('?status=arrived')->json('bookings.*.code'));
        $this->assertSame(['F2-3NSX'], $list('?status=no_show')->json('bookings.*.code'));
        $this->assertSame(['F2-7K4Q'], $list('?q=4410')->json('bookings.*.code'));          // last 4 phone digits
        $this->assertSame(['F2-7K4Q'], $list('?q=b5')->json('bookings.*.code'));            // table
        $this->assertSame(['F2-1CVB'], $list('?q=f2-1cvb')->json('bookings.*.code'));       // booking code
        $this->assertSame(['F2-2PZM'], $list('?q=wayan')->json('bookings.*.code'));         // name
        $this->assertSame([], $list('?status=held&q=wayan')->json('bookings'));
        $this->assertSame([], $list('?q='.urlencode(self::phone('4410')))->json('bookings')); // the full number finds nothing
        $list('?status=paid&q=wayan')->assertJsonPath('counts.paid', 2)->assertJsonPath('counts.held', 1);

        $this->getJson('/api/admin/events/'.self::NIGHT.'/table-bookings?status=expired')->assertUnprocessable();
    }

    public function test_manager_release_expires_the_invoice_once_and_frees_the_table(): void
    {
        $this->booking('F2-4LWX', 'S3', BookingStatus::Held, ['xendit_invoice_id' => 'inv_F2-4LWX']);
        $this->booking('F2-1CVB', 'S1', BookingStatus::Paid);
        $this->asManager();

        $this->postJson('/api/admin/table-bookings/F2-4LWX/release')->assertOk()->assertExactJson(['status' => 'released']);
        $this->postJson('/api/admin/table-bookings/F2-4LWX/release')->assertOk()->assertExactJson(['status' => 'released']);

        Http::assertSentCount(1);
        Http::assertSent(fn (HttpRequest $r) => $r->method() === 'POST' && $r->url() === 'https://api.xendit.co/invoices/inv_F2-4LWX/expire!');
        $this->assertSame(BookingStatus::Released, TableBooking::firstWhere('code', 'F2-4LWX')->status);

        $this->postJson('/api/admin/table-bookings/F2-1CVB/release')
            ->assertStatus(409)->assertExactJson(['message' => "This table is already paid. Deposits aren't refunded."]);
        $this->postJson('/api/admin/table-bookings/F2-NONE/release')
            ->assertNotFound()->assertExactJson(['message' => "We couldn't find that booking."]);
        Http::assertSentCount(1);
    }

    // T-U10
    public function test_no_show_cancels_the_pass_keeps_the_deposit_and_calls_nobody(): void
    {
        $booking = $this->booking('F2-2PZM', 'B2', BookingStatus::Paid, ['name' => 'Wayan Dharma']);
        $this->travel(1)->minutes();
        $since = now()->toIso8601String();

        $this->asManager()->postJson('/api/admin/table-bookings/F2-2PZM/no-show')->assertOk()
            ->assertJsonPath('code', 'F2-2PZM')->assertJsonPath('status', 'no_show')->assertJsonPath('deposit', 12000000)
            ->assertJsonPath('inside_count', 0)->assertJsonPath('check_ins', []);

        $booking->refresh();
        $this->assertSame(BookingStatus::NoShow, $booking->status);
        $this->assertSame(12000000, $booking->deposit);
        $this->assertNotNull($booking->pass->revoked_at);
        Http::assertNothingSent();

        // F6: a forfeited deposit is still money taken tonight; the table itself is free again.
        $this->getJson('/api/admin/tonight')->assertJsonPath('deposits', 12000000)->assertJsonPath('tables.booked', 0);

        // The door devices learn about it on their next sync.
        $this->getJson('/api/door/'.self::NIGHT.'/manifest?since='.urlencode($since))->assertOk()
            ->assertJsonCount(1, 'passes')->assertJsonPath('passes.0.public_id', $booking->pass->public_id)->assertJsonPath('passes.0.revoked', true);
    }

    public function test_no_show_only_for_a_paid_table_nobody_has_come_in_on(): void
    {
        $this->booking('F2-4LWX', 'S3', BookingStatus::Held);
        $this->booking('F2-8HJN', 'T4', BookingStatus::Released);
        $this->booking('F2-3NSX', 'B3', BookingStatus::NoShow);
        $this->arrive($this->booking('F2-7K4Q', 'B5', BookingStatus::Paid)->pass, 1, '22:40');
        $noShow = fn (string $code) => $this->postJson("/api/admin/table-bookings/{$code}/no-show")->assertStatus(409);
        $this->asManager();

        $noShow('F2-4LWX')->assertExactJson(['message' => "This table isn't paid. Release it instead."]);
        $noShow('F2-8HJN')->assertExactJson(['message' => 'This table was already released.']);
        $noShow('F2-3NSX')->assertExactJson(['message' => 'This table is already marked as a no-show.']);
        $noShow('F2-7K4Q')->assertExactJson(['message' => 'Someone from this table is already inside.']);
        $this->postJson('/api/admin/table-bookings/F2-NONE/no-show')->assertNotFound()->assertExactJson(['message' => "We couldn't find that booking."]);

        $this->assertSame(BookingStatus::Paid, TableBooking::firstWhere('code', 'F2-7K4Q')->status);
        $this->assertSame(1, Pass::whereNotNull('revoked_at')->count()); // only the no-show made in setup
        Http::assertNothingSent();
    }

    public function test_guestlist_filters_by_qr_type_arrival_and_search(): void
    {
        $ayu = $this->signup('Ayu Pratiwi', '1234', 4);
        $putu = $this->signup('Putu Ananda', '0937', 2);
        $this->signup('Nengah Budi', '5170', 3, QrMode::Personal, ['Kadek Surya', 'Luh Sari']);
        $this->signup('Dewi Lestari', '4482', 6);
        $this->signup('Rina Removed', '7777', 3)->update(['removed_at' => now()]);
        $this->arrive($ayu->passes[0], 2, '23:12', CheckInMethod::Override);
        $this->arrive($putu->passes[0], 2, '22:14');
        $list = fn (string $query = '') => $this->getJson('/api/admin/events/'.self::NIGHT.'/guestlist'.$query)->assertOk();
        $names = fn (string $query) => $list($query)->json('signups.*.name');
        $this->asManager();

        $list()->assertJsonPath('summary', ['signed' => 15, 'quota' => 200, 'cutoff' => '23:00'])
            ->assertJsonPath('counts', ['group' => 3, 'personal' => 1, 'none' => 2, 'part' => 1, 'all' => 1])
            ->assertJsonPath('signups.*.name', ['Ayu Pratiwi', 'Dewi Lestari', 'Nengah Budi', 'Putu Ananda'])
            ->assertJsonPath('signups.0', [
                'id' => $ayu->id, 'name' => 'Ayu Pratiwi', 'phone_last4' => '1234', 'qr_mode' => 'group', 'party_size' => 4, 'inside' => 2,
                'created_at' => $ayu->created_at->toIso8601String(),
                'passes' => [['holder_name' => 'Ayu Pratiwi', 'people' => 4, 'inside_count' => 2, 'revoked' => false]],
            ]);

        $this->assertSame(['Nengah Budi'], $names('?qr_mode=personal'));
        $list('?qr_mode=personal')->assertJsonPath('signups.0.passes.*.holder_name', ['Nengah Budi', 'Kadek Surya', 'Luh Sari']);
        $this->assertSame(['Dewi Lestari', 'Nengah Budi'], $names('?arrival=none'));
        $this->assertSame(['Ayu Pratiwi'], $names('?arrival=part'));
        $this->assertSame(['Putu Ananda'], $names('?arrival=all'));
        $this->assertSame(['Dewi Lestari'], $names('?qr_mode=group&arrival=none'));
        $this->assertSame(['Nengah Budi'], $names('?q=kadek'));      // a pass holder's name
        $this->assertSame(['Putu Ananda'], $names('?q=0937'));       // last 4 phone digits
        $this->assertSame(['Ayu Pratiwi'], $names('?q=PRATIWI'));    // the organiser's name
        $this->assertSame([], $names('?q=rina'));                     // removed signups are gone
        $list('?q=kadek')->assertJsonPath('counts.group', 3);

        $this->getJson('/api/admin/events/'.self::NIGHT.'/guestlist?arrival=some')->assertUnprocessable();
        $this->getJson('/api/admin/events/'.self::NIGHT.'/guestlist?qr_mode=vip')->assertUnprocessable();
    }

    public function test_removing_a_signup_cancels_its_passes_and_frees_the_number(): void
    {
        $this->travelTo(self::NIGHT.' 21:00'); // before the list closes, so the number can sign up again
        $dewi = $this->signup('Dewi Lestari', '4482', 2, QrMode::Personal, ['Sekar']);
        $ayu = $this->signup('Ayu Pratiwi', '1234', 4);
        $this->arrive($ayu->passes[0], 1, '20:50');
        $again = fn () => $this->postJson('/api/guestlist', [
            'date' => self::NIGHT, 'party_size' => 1, 'qr_mode' => 'group', 'name' => 'Dewi Lestari',
            'phone' => '0812-999-4482', 'email' => 'dewi@example.com', 'age_confirmed' => true,
        ]);
        $this->asManager();

        $again()->assertStatus(409); // F8: still on the list
        $this->deleteJson("/api/admin/guestlist/{$ayu->id}")
            ->assertStatus(409)->assertExactJson(['message' => "Someone from this group is already inside, so they can't be removed."]);
        $this->assertNull($ayu->fresh()->removed_at);

        $this->deleteJson("/api/admin/guestlist/{$dewi->id}")->assertNoContent();
        $this->assertNotNull($dewi->fresh()->removed_at);
        $this->assertSame(2, $dewi->passes()->whereNotNull('revoked_at')->count());
        $this->assertSame(['Ayu Pratiwi'], $this->getJson('/api/admin/events/'.self::NIGHT.'/guestlist')->json('signups.*.name'));

        $this->deleteJson("/api/admin/guestlist/{$dewi->id}")->assertNotFound()->assertExactJson(['message' => "We couldn't find that signup."]);
        $this->deleteJson('/api/admin/guestlist/999999')->assertNotFound()->assertExactJson(['message' => "We couldn't find that signup."]);

        $again()->assertCreated();
    }

    // T-P8, and the "Manager overrides" chip.
    public function test_door_log_newest_first_with_override_and_conflict_filters(): void
    {
        $ayu = $this->signup('Ayu Pratiwi', '1234', 4);
        $putu = $this->signup('Putu Ananda', '0937', 2);
        $made = $this->booking('F2-7K4Q', 'B5', BookingStatus::Paid);
        $this->arrive($made->pass, 3, '22:40');
        $this->arrive($ayu->passes[0], 2, '23:12', CheckInMethod::Override);

        // Two offline scans of Putu's group QR, 2 people each, synced later: both kept, the second one flagged.
        $offline = fn (string $time) => ['client_uuid' => (string) Str::uuid(), 'public_id' => $putu->passes[0]->public_id, 'count' => 2,
            'method' => 'scan', 'scanned_at' => Night::at(self::NIGHT, $time)->toIso8601String()];
        $this->actingAs(User::firstWhere('role', StaffRole::Door))
            ->postJson('/api/door/check-ins', ['items' => [$offline('22:14'), $offline('22:15')]])->assertOk();

        $log = fn (string $query = '') => $this->getJson('/api/admin/events/'.self::NIGHT.'/check-ins'.$query)->assertOk();
        $this->asManager();

        $all = $log()->assertJsonPath('counts', ['total' => 4, 'overrides' => 1, 'conflicts' => 1]);
        $this->assertSame(['Ayu Pratiwi', 'Made Wirawan', 'Putu Ananda', 'Putu Ananda'], $all->json('check_ins.*.holder_name'));
        $all->assertJsonPath('check_ins.1', [
            'id' => CheckIn::where('pass_id', $made->pass->id)->value('id'), 'scanned_at' => '2026-09-25T22:40:00+08:00',
            'holder_name' => 'Made Wirawan', 'kind' => 'table', 'table_code' => 'B5', 'count' => 3, 'method' => 'scan', 'conflict' => false,
            'staff_name' => 'Door staff A',
        ]);

        $log('?overrides=1')->assertJsonCount(1, 'check_ins')->assertJsonPath('check_ins.0.method', 'override')
            ->assertJsonPath('check_ins.0.staff_name', 'Manager')->assertJsonPath('check_ins.0.table_code', null)
            ->assertJsonPath('counts.total', 4);
        $log('?conflicts=1')->assertJsonCount(1, 'check_ins')->assertJsonPath('check_ins.0.holder_name', 'Putu Ananda')
            ->assertJsonPath('check_ins.0.conflict', true)->assertJsonPath('check_ins.0.scanned_at', '2026-09-25T22:15:00+08:00');
        $log('?overrides=1&conflicts=1')->assertJsonCount(0, 'check_ins');
    }
}
