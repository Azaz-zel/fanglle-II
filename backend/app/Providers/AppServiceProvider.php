<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // A portfolio demo must never be able to charge real money because a live key was pasted by mistake.
        if (! str_starts_with((string) config('services.xendit.secret_key'), 'xnd_development_')) {
            throw new RuntimeException('XENDIT_SECRET_KEY must be a test-mode key starting with xnd_development_. Refusing to start.');
        }

        // F16 / B10.1: per IP and per route, so tries on the booking form don't use up the guestlist's.
        // The Xendit webhook has no limiter on purpose: a cache read would query the database before its token is checked (F7).
        $tooMany = fn (Request $request, array $headers) => response()->json(['message' => 'Too many tries. Wait a minute, then try again.'], 429, $headers);
        $perIp = fn (Request $request, int $perMinute) => Limit::perMinute($perMinute)->by($request->route()->uri().'|'.$request->ip())->response($tooMany);

        RateLimiter::for('public-posts', fn (Request $request) => $perIp($request, config('fanglle.public_posts_per_minute')));
        // A held booking page polls every 3 seconds (20 a minute per tab).
        RateLimiter::for('guest-polls', fn (Request $request) => $perIp($request, 60));
    }
}
