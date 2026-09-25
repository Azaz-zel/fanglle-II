<?php

namespace App\Providers;

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
    }
}
