<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\File;

abstract class TestCase extends BaseTestCase
{
    /** A throwaway QR signing key, so tests never touch the real one in storage/app/keys. */
    protected function useTestSigningKey(): void
    {
        $dir = storage_path('framework/testing/keys-'.getmypid());
        config(['fanglle.qr_private_key_path' => $dir.'/qr-private.pem']);
        $this->artisan('fanglle:keys', ['--force' => true])->assertSuccessful();
        $this->beforeApplicationDestroyed(fn () => File::deleteDirectory($dir));
    }
}
