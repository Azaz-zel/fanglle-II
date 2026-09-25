<?php

return [

    // F3: doors open at the same time every night.
    'night_opens_at' => env('NIGHT_OPENS_AT', '15:00'),

    // The "of 600 capacity" on the manager's overview.
    'venue_capacity' => (int) env('VENUE_CAPACITY', 600),

    'qr_private_key_path' => base_path(env('QR_PRIVATE_KEY_PATH', 'storage/app/keys/qr-private.pem')),

    // Windows PHP builds cannot create keys without an explicit openssl.cnf.
    'openssl_conf' => env('OPENSSL_CONF'),

];
