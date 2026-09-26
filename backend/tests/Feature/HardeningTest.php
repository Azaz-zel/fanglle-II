<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Symfony\Component\Process\ExecutableFinder;
use Tests\TestCase;

// B10.1: rate limits, security headers, daily backup.
class HardeningTest extends TestCase
{
    use RefreshDatabase;

    private const TOO_MANY = ['message' => 'Too many tries. Wait a minute, then try again.'];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-25 20:00');
        $this->seed();
        Mail::fake();
        Http::fake(['api.xendit.co/v2/invoices' => fn (HttpRequest $r) => Http::response(['id' => 'inv_'.$r['external_id'], 'invoice_url' => 'https://checkout-staging.xendit.co/x'])]);
    }

    private function hold(string $ip = '203.0.113.7')
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip])->postJson('/api/table-bookings', [
            'date' => '2026-09-25', 'table_code' => 'B5', 'party_size' => 4, 'name' => 'Made Wirawan',
            'phone' => '081234567890', 'email' => 'made@example.com', 'age_confirmed' => true,
        ]);
    }

    private function signUp(string $ip = '203.0.113.7')
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip])->postJson('/api/guestlist', []);
    }

    public function test_the_eleventh_table_hold_in_a_minute_from_one_ip_is_429(): void
    {
        $this->hold()->assertCreated();
        foreach (range(2, 10) as $_) {
            $this->hold()->assertConflict(); // B5 is taken, but every try counts
        }

        $this->hold()->assertTooManyRequests()->assertExactJson(self::TOO_MANY)->assertHeader('Retry-After');
        $this->hold('198.51.100.9')->assertConflict(); // another IP is not locked out
        $this->signUp()->assertUnprocessable(); // nor is the same IP on another form

        $this->travel(61)->seconds();
        $this->hold()->assertConflict();
    }

    public function test_the_eleventh_guestlist_signup_in_a_minute_from_one_ip_is_429(): void
    {
        foreach (range(1, 10) as $_) {
            $this->signUp()->assertUnprocessable();
        }

        $this->signUp()->assertTooManyRequests()->assertExactJson(self::TOO_MANY)->assertHeader('Retry-After');
        $this->signUp('198.51.100.9')->assertUnprocessable();
    }

    public function test_resend_has_its_own_ten_a_minute_per_ip(): void
    {
        foreach (range(1, 10) as $_) {
            $this->postJson('/api/guestlist/resend', [])->assertUnprocessable();
        }
        $this->postJson('/api/guestlist/resend', [])->assertTooManyRequests()->assertExactJson(self::TOO_MANY);
    }

    public function test_the_limit_is_a_config_knob(): void
    {
        config(['fanglle.public_posts_per_minute' => 20]);

        foreach (range(1, 20) as $_) {
            $this->signUp()->assertUnprocessable();
        }
        $this->signUp()->assertTooManyRequests();
    }

    public function test_booking_polls_and_releases_allow_sixty_a_minute(): void
    {
        foreach (range(1, 60) as $_) {
            $this->getJson('/api/table-bookings/F2-ZZZZ?k=x')->assertNotFound();
        }
        $this->getJson('/api/table-bookings/F2-ZZZZ?k=x')->assertTooManyRequests()->assertExactJson(self::TOO_MANY);
        $this->postJson('/api/table-bookings/F2-ZZZZ/release?k=x')->assertNotFound(); // its own bucket
    }

    public function test_limited_guest_routes_start_no_session(): void
    {
        $this->withHeader('Origin', 'http://localhost:5173'); // would start one on a stateful route
        $this->signUp()->assertUnprocessable()->assertCookieMissing(config('session.cookie'));
    }

    // F7: a limiter on a database cache would query before the token is checked, so the webhook has none.
    public function test_the_webhook_is_never_limited_and_queries_nothing_before_its_token(): void
    {
        config(['cache.default' => 'database', 'session.driver' => 'database', 'services.xendit.callback_token' => 'callback-token']);
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        foreach (range(1, 70) as $_) {
            $this->postJson('/api/webhooks/xendit', ['id' => 'inv_x', 'external_id' => 'F2-ZZZZ', 'status' => 'PAID'], ['x-callback-token' => 'wrong'])
                ->assertForbidden();
        }

        $this->assertSame([], $queries);
        $middleware = Route::getRoutes()->match(Request::create('/api/webhooks/xendit', 'POST'))->gatherMiddleware();
        $this->assertSame([], array_filter($middleware, fn ($m) => is_string($m) && str_contains($m, 'hrottle')));
    }

    public function test_security_headers_on_pages_and_api(): void
    {
        $public = storage_path('framework/testing/public-headers');
        File::ensureDirectoryExists($public.'/app');
        File::put($public.'/app/index.html', '<div id="root"></div>');
        $this->app->usePublicPath($public);

        try {
            foreach ([$this->get('/events/2026-09-25')->assertOk(), $this->getJson('/api/events')->assertOk()] as $response) {
                $response->assertHeader('X-Content-Type-Options', 'nosniff')
                    ->assertHeader('X-Frame-Options', 'DENY')
                    ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
                    ->assertHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
                    ->assertHeaderMissing('Strict-Transport-Security');

                $csp = $response->headers->get('Content-Security-Policy');
                foreach (["default-src 'self'", "script-src 'self' https://challenges.cloudflare.com", 'frame-src https://challenges.cloudflare.com',
                    "connect-src 'self' https://challenges.cloudflare.com", "frame-ancestors 'none'"] as $directive) {
                    $this->assertStringContainsString($directive, $csp);
                }
                $this->assertDoesNotMatchRegularExpression("/script-src[^;]*'unsafe-(inline|eval)'/", $csp);
            }
        } finally {
            File::deleteDirectory($public);
        }

        $this->getJson('https://localhost/api/events')->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    public function test_backup_writes_a_gzipped_dump_and_deletes_old_ones(): void
    {
        if (! (new ExecutableFinder)->find('mysqldump')) {
            $this->markTestSkipped('mysqldump is not on PATH.');
        }
        $storage = storage_path('framework/testing/storage-backup');
        File::deleteDirectory($storage);
        $this->app->useStoragePath($storage);
        File::ensureDirectoryExists($storage.'/app/backups');
        $old = $storage.'/app/backups/fanglle-2026-09-01-0500.sql.gz';
        $recent = $storage.'/app/backups/fanglle-2026-09-20-0500.sql.gz';
        File::put($old, '');
        File::put($recent, '');
        touch($old, now()->subDays(15)->getTimestamp());
        touch($recent, now()->subDays(13)->getTimestamp());

        try {
            $this->artisan('fanglle:backup')->assertSuccessful();

            $this->assertFileDoesNotExist($old);
            $this->assertFileExists($recent);
            $dump = gzdecode(file_get_contents($storage.'/app/backups/fanglle-2026-09-25-2000.sql.gz'));
            $this->assertStringContainsString('CREATE TABLE `table_bookings`', $dump);
            $this->assertStringContainsString('-- Dump completed', $dump);
        } finally {
            File::deleteDirectory($storage);
        }
    }

    public function test_backup_fails_loudly(): void
    {
        if (! (new ExecutableFinder)->find('mysqldump')) {
            $this->markTestSkipped('mysqldump is not on PATH.');
        }
        config(['database.connections.mysql.database' => 'fanglle_no_such_database']);
        $this->app->useStoragePath($storage = storage_path('framework/testing/storage-backup'));

        $this->artisan('fanglle:backup')->expectsOutputToContain('mysqldump failed for database fanglle_no_such_database')->assertFailed();
        $this->assertDirectoryDoesNotExist($storage.'/app/backups');
    }
}
