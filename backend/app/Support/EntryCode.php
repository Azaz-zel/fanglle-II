<?php

namespace App\Support;

/** F17: manual entry codes in Crockford base32, so there is no I, L, O or U to misread. */
final class EntryCode
{
    public const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    public static function generate(int $length = 8): string
    {
        $code = '';
        for ($i = 0; $i < $length; $i++) {
            $code .= self::ALPHABET[random_int(0, 31)];
        }

        return $code;
    }

    public static function normalize(string $typed): string
    {
        return strtr(strtoupper(preg_replace('/[\s-]+/', '', $typed)), ['O' => '0', 'I' => '1', 'L' => '1']);
    }

    public static function format(string $code): string
    {
        return substr($code, 0, 4).'-'.substr($code, 4);
    }
}
