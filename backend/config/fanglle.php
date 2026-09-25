<?php

return [

    'qr_private_key_path' => base_path(env('QR_PRIVATE_KEY_PATH', 'storage/app/keys/qr-private.pem')),

    // Windows PHP builds cannot create keys without an explicit openssl.cnf.
    'openssl_conf' => env('OPENSSL_CONF'),

];
