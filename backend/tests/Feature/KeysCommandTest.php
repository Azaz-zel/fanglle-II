<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class KeysCommandTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dir = storage_path('framework/testing/keys');
        File::deleteDirectory($this->dir);
        config(['fanglle.qr_private_key_path' => $this->dir.'/qr-private.pem']);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->dir);
        parent::tearDown();
    }

    public function test_creates_a_p256_private_key(): void
    {
        $this->artisan('fanglle:keys')->assertSuccessful();

        $details = openssl_pkey_get_details(openssl_pkey_get_private(file_get_contents($this->dir.'/qr-private.pem')));
        $this->assertSame(OPENSSL_KEYTYPE_EC, $details['type']);
        $this->assertSame('prime256v1', $details['ec']['curve_name']);
    }

    public function test_never_replaces_a_key_without_force(): void
    {
        $this->artisan('fanglle:keys')->assertSuccessful();
        $first = file_get_contents($this->dir.'/qr-private.pem');

        $this->artisan('fanglle:keys')->assertFailed();
        $this->assertSame($first, file_get_contents($this->dir.'/qr-private.pem'));

        $this->artisan('fanglle:keys', ['--force' => true])->assertSuccessful();
        $this->assertNotSame($first, file_get_contents($this->dir.'/qr-private.pem'));
    }
}
