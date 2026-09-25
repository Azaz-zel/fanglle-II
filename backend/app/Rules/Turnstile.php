<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

/** F16: use as `'turnstile_token' => [new Turnstile]` on every public POST. Skipped while TURNSTILE_SECRET is empty. */
class Turnstile implements ValidationRule
{
    // Runs even when the token is missing, which is exactly the case to reject.
    public bool $implicit = true;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $secret = config('services.turnstile.secret');
        if (blank($secret)) {
            return;
        }

        $passed = is_string($value) && $value !== '' && rescue(fn () => Http::asForm()->timeout(5)
            ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $secret, 'response' => $value, 'remoteip' => request()->ip(),
            ])->json('success'), false) === true;

        if (! $passed) {
            $fail("We couldn't check that you're not a bot. Please try again.");
        }
    }
}
