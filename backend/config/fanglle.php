<?php

return [

    // F3: doors open at the same time every night.
    'night_opens_at' => env('NIGHT_OPENS_AT', '15:00'),

    // The "of 600 capacity" on the manager's overview.
    'venue_capacity' => (int) env('VENUE_CAPACITY', 600),

    'qr_private_key_path' => base_path(env('QR_PRIVATE_KEY_PATH', 'storage/app/keys/qr-private.pem')),

    // F16 / B10.1: public POSTs per IP per minute. The concurrency scripts raise it; they fire 50 from one IP.
    'public_posts_per_minute' => (int) env('PUBLIC_POSTS_PER_MINUTE', 10),

    // fanglle:backup deletes dumps older than this.
    'backup_keep_days' => (int) env('BACKUP_KEEP_DAYS', 14),

    // Windows PHP builds cannot create keys without an explicit openssl.cnf.
    'openssl_conf' => env('OPENSSL_CONF'),

];
