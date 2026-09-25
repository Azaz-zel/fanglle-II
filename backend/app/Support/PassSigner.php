<?php

namespace App\Support;

use InvalidArgumentException;
use OpenSSLAsymmetricKey;
use RuntimeException;

/**
 * F10: QR = FNG2.{payload}.{sig}. sig is ECDSA P-256 / SHA-256 over the payload string, as raw r‖s (IEEE P1363),
 * because WebCrypto at the door only verifies that format and openssl_sign only produces DER.
 */
final class PassSigner
{
    private OpenSSLAsymmetricKey $key;

    public function __construct()
    {
        $path = config('fanglle.qr_private_key_path');
        $key = is_file($path) ? openssl_pkey_get_private(file_get_contents($path)) : false;
        if (! $key) {
            throw new RuntimeException("No QR signing key at {$path}. Create one with `php artisan fanglle:keys`.");
        }
        $this->key = $key;
    }

    /** @param  string  $kind  group | personal | table */
    public function sign(string $publicId, string $date, string $kind): string
    {
        $payload = self::b64url(json_encode(['p' => $publicId, 'e' => $date, 'k' => $kind], JSON_UNESCAPED_SLASHES));
        openssl_sign($payload, $der, $this->key, OPENSSL_ALGO_SHA256);

        return 'FNG2.'.$payload.'.'.self::b64url(self::derToRaw($der, 32));
    }

    /** The public half for door devices, as a JWK that crypto.subtle.importKey takes directly. */
    public function publicJwk(): array
    {
        $ec = openssl_pkey_get_details($this->key)['ec'];

        return [
            'kty' => 'EC',
            'crv' => 'P-256',
            'x' => self::b64url(str_pad($ec['x'], 32, "\x00", STR_PAD_LEFT)),
            'y' => self::b64url(str_pad($ec['y'], 32, "\x00", STR_PAD_LEFT)),
        ];
    }

    /**
     * DER SEQUENCE { INTEGER r, INTEGER s } to r‖s, each left-padded to $size bytes. DER adds a 0x00 when the
     * top bit is set and drops leading zeros, so r and s are 31 to 33 bytes; getting either wrong fails about half the time.
     */
    public static function derToRaw(string $der, int $size): string
    {
        if (strlen($der) < 8 || $der[0] !== "\x30" || ord($der[1]) !== strlen($der) - 2) {
            throw new InvalidArgumentException('Not a DER ECDSA signature.');
        }

        $raw = '';
        $offset = 2;
        foreach (['r', 's'] as $part) {
            $length = ord($der[$offset + 1] ?? "\x00");
            if (($der[$offset] ?? '') !== "\x02" || $length === 0) {
                throw new InvalidArgumentException("DER signature has no INTEGER {$part}.");
            }
            $int = ltrim(substr($der, $offset + 2, $length), "\x00");
            if (strlen($int) > $size) {
                throw new InvalidArgumentException("DER INTEGER {$part} is longer than {$size} bytes.");
            }
            $raw .= str_pad($int, $size, "\x00", STR_PAD_LEFT);
            $offset += 2 + $length;
        }

        if ($offset !== strlen($der)) {
            throw new InvalidArgumentException('DER signature has trailing bytes.');
        }

        return $raw;
    }

    public static function b64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }
}
