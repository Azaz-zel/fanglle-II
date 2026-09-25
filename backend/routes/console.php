<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

Artisan::command('fanglle:keys {--force : Replace the existing key}', function () {
    $path = config('fanglle.qr_private_key_path');

    if (File::exists($path) && ! $this->option('force')) {
        $this->error("A QR signing key already exists at {$path}. Replacing it makes every QR already issued fail at the door. Run with --force if that is what you want.");

        return 1;
    }

    $options = array_filter([
        'private_key_type' => OPENSSL_KEYTYPE_EC,
        'curve_name' => 'prime256v1',
        'config' => config('fanglle.openssl_conf'),
    ]);

    $key = openssl_pkey_new($options);
    if (! $key || ! openssl_pkey_export($key, $pem, null, $options)) {
        $this->error('OpenSSL could not create the key: '.openssl_error_string().'. On Windows, set OPENSSL_CONF to the path of openssl.cnf.');

        return 1;
    }

    File::ensureDirectoryExists(dirname($path));
    File::put($path, $pem);
    chmod($path, 0600);
    $this->info("QR signing key (ECDSA P-256) written to {$path}.");
})->purpose('Create the private key that signs QR passes');
