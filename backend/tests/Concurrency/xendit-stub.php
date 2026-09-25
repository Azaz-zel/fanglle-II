<?php

// Stand-in for the Xendit Invoice API, for hold-same-table.sh only. Answers every call with a fresh open invoice
// and logs it, so the script can count how many invoices the app really asked for.
$body = json_decode(file_get_contents('php://input'), true) ?: [];
file_put_contents(getenv('STUB_LOG') ?: sys_get_temp_dir().'/xendit-stub.log', "{$_SERVER['REQUEST_METHOD']} {$_SERVER['REQUEST_URI']} ".($body['external_id'] ?? '')."\n", FILE_APPEND | LOCK_EX);

header('Content-Type: application/json');
echo json_encode([
    'id' => 'inv_stub_'.bin2hex(random_bytes(6)),
    'invoice_url' => 'http://127.0.0.1/stub-invoice/'.($body['external_id'] ?? ''),
    'status' => 'PENDING',
]);
