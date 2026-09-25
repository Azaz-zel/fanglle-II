<?php

namespace App\Support;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/** The three Invoice API calls this app makes. No SDK (Dokumen 1 §2). */
final class Xendit
{
    /** @return array{id?: string, invoice_url?: string} */
    public static function createInvoice(array $invoice): array
    {
        return self::http()->post('v2/invoices', $invoice)->throw()->json();
    }

    public static function invoiceStatus(string $id): ?string
    {
        return rescue(fn () => self::http()->get("v2/invoices/{$id}")->throw()->json('status'), null, false);
    }

    /**
     * Kills an open invoice and says what state it ended in. If expiring fails, asks for the status instead,
     * because a paid invoice cannot be expired and the caller must learn it was paid.
     */
    public static function expireInvoice(string $id): ?string
    {
        return rescue(
            fn () => self::http()->post("invoices/{$id}/expire!")->throw()->json('status'),
            fn () => self::invoiceStatus($id),
            false,
        );
    }

    private static function http(): PendingRequest
    {
        return Http::baseUrl(config('services.xendit.base_url'))
            ->withBasicAuth(config('services.xendit.secret_key'), '')
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(15);
    }
}
