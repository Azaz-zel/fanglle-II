<?php

namespace App\Support;

use App\Rules\Turnstile;

/** The checks every public guest form shares: table booking, guestlist, resend. */
final class GuestContact
{
    public const PHONE = ['required', 'string', 'regex:/^\+?[0-9\s-]{9,16}$/'];

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'phone' => self::PHONE,
            'email' => ['required', 'string', 'email', 'max:255'],
            'age_confirmed' => ['accepted'],
            'turnstile_token' => [new Turnstile],
        ];
    }

    public static function messages(): array
    {
        return [
            'email' => 'Enter your email. Your QR is sent there.',
            'age_confirmed' => 'Everyone in the group must be 21 or over.',
        ];
    }

    /**
     * One number, one form (F8): "0812-3456", "62 812 3456" and "+62 812 3456" are the same Indonesian number.
     * Foreign numbers keep the + the guest typed.
     */
    public static function phone(string $typed): string
    {
        $digits = preg_replace('/[\s-]+/', '', $typed);

        return preg_replace('/^(?:0|62)(?=\d)/', '+62', $digits);
    }
}
