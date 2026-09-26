<?php

use App\Models\TableBooking;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schedule;
use Symfony\Component\Process\Process;

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

// F5: every minute, holds past held_until go back to the floor. Idempotent beside webhooks and polling.
Artisan::command('bookings:expire', function () {
    $this->info(TableBooking::releaseExpired().' expired table holds released.');
})->purpose('Release table holds whose 15 minutes have run out');

// B10.1: a gzipped mysqldump of the default connection, kept BACKUP_KEEP_DAYS days. Restore: gunzip -c FILE | mysql DB.
// ponytail: the whole dump sits in memory before gzencode; stream it through gzopen if the database ever passes a few hundred MB.
Artisan::command('fanglle:backup', function () {
    $db = config('database.connections.'.config('database.default'));
    $dir = storage_path('app/backups');

    $args = ['mysqldump', '--single-transaction', '--routines', '--no-tablespaces', '--host='.$db['host'], '--port='.$db['port'], '--user='.$db['username']];
    if (! empty($db['unix_socket'])) {
        $args[] = '--socket='.$db['unix_socket'];
    }
    $args[] = $db['database'];

    // The password goes through the environment: on the command line it would show in the process list.
    $dump = new Process($args, env: ['MYSQL_PWD' => (string) $db['password']], timeout: 600);
    $dump->run();
    if (! $dump->isSuccessful() || $dump->getOutput() === '') {
        $this->error("mysqldump failed for database {$db['database']} (exit {$dump->getExitCode()}): ".(trim($dump->getErrorOutput()) ?: 'no output.'));

        return 1;
    }

    File::ensureDirectoryExists($dir);
    $path = $dir.'/fanglle-'.now()->format('Y-m-d-Hi').'.sql.gz';
    if (File::put($path, gzencode($dump->getOutput(), 9)) === false) {
        $this->error("Could not write {$path}.");

        return 1;
    }
    $this->info("Backup of {$db['database']} written to {$path}.");

    $cutoff = now()->subDays(config('fanglle.backup_keep_days'))->getTimestamp();
    foreach (File::glob($dir.'/fanglle-*.sql.gz') as $old) {
        if (File::lastModified($old) < $cutoff) {
            File::delete($old);
            $this->line('Deleted old backup '.basename($old).'.');
        }
    }
})->purpose('Dump the database to storage/app/backups and delete old dumps');

Schedule::command('bookings:expire')->everyMinute()->withoutOverlapping();
Schedule::command('fanglle:backup')->dailyAt('05:00');
