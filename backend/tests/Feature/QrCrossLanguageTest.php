<?php

namespace Tests\Feature;

use App\Support\PassSigner;
use Illuminate\Support\Str;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Tests\TestCase;

// T-P1 / B5 pass criterion: what PHP signs, the browser's WebCrypto verifies. 200 random passes, so a DER to r‖s
// slip (r or s with a high first byte, or shorter than 32 bytes) can't hide behind a lucky few.
class QrCrossLanguageTest extends TestCase
{
    public function test_webcrypto_verifies_every_qr_php_signs_and_rejects_a_tampered_one(): void
    {
        $node = (new ExecutableFinder)->find('node');
        if (! $node) {
            $this->markTestSkipped('Node.js is not installed; the WebCrypto check needs `node` on PATH.');
        }

        $this->useTestSigningKey();
        $signer = new PassSigner;

        $items = [];
        foreach (range(1, 200) as $i) {
            $date = now()->addDays(random_int(-400, 400))->toDateString();
            $items[] = ['qr' => $signer->sign((string) Str::ulid(), $date, ['group', 'personal', 'table'][random_int(0, 2)])];
        }

        // T-P2: one payload character changed must fail.
        [$prefix, $payload, $sig] = explode('.', $items[0]['qr']);
        $payload[5] = $payload[5] === 'A' ? 'B' : 'A';
        $tampered = ['qr' => "{$prefix}.{$payload}.{$sig}"];

        $fixture = tempnam(sys_get_temp_dir(), 'qr').'.json';
        file_put_contents($fixture, json_encode(['jwk' => $signer->publicJwk(), 'items' => [...$items, $tampered]]));

        $process = new Process([$node, base_path('tests/Support/verify-qr.mjs'), $fixture]);
        $process->mustRun();
        unlink($fixture);
        $result = json_decode($process->getOutput(), true);

        fwrite(STDERR, sprintf("\n  WebCrypto verified %d of %d PHP-signed QRs; tampered QR verified: %s\n",
            count(array_filter(array_slice($result['results'], 0, 200))), 200, var_export(end($result['results']), true)));

        $this->assertSame(array_fill(0, 200, true), array_slice($result['results'], 0, 200));
        $this->assertFalse(end($result['results']));
    }

    public function test_the_public_key_is_a_p256_jwk_with_32_byte_coordinates(): void
    {
        $this->useTestSigningKey();

        $jwk = (new PassSigner)->publicJwk();

        $this->assertSame(['kty', 'crv', 'x', 'y'], array_keys($jwk));
        $this->assertSame(['EC', 'P-256'], [$jwk['kty'], $jwk['crv']]);
        foreach (['x', 'y'] as $c) {
            $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+$/', $jwk[$c]);
            $this->assertSame(32, strlen(base64_decode(strtr($jwk[$c], '-_', '+/'))));
        }
    }

    public function test_the_payload_is_the_contract_json(): void
    {
        $this->useTestSigningKey();

        [$prefix, $payload] = explode('.', (new PassSigner)->sign('01K5ABCDEFGHJKMNPQRSTVWXYZ', '2026-09-25', 'table'));

        $this->assertSame('FNG2', $prefix);
        $this->assertSame('{"p":"01K5ABCDEFGHJKMNPQRSTVWXYZ","e":"2026-09-25","k":"table"}', base64_decode(strtr($payload, '-_', '+/')));
    }

    public function test_a_missing_key_says_how_to_make_one(): void
    {
        config(['fanglle.qr_private_key_path' => storage_path('framework/testing/no-such-key.pem')]);

        $this->expectExceptionMessage('php artisan fanglle:keys');
        new PassSigner;
    }
}
