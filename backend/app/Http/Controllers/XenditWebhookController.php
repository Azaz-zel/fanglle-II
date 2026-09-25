<?php

namespace App\Http\Controllers;

use App\Models\TableBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** F7. The route runs without session middleware, so nothing touches the database before the token matches. */
class XenditWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // hash_equals('', '') is true: an unset token must never let a callback through.
        $token = (string) config('services.xendit.callback_token');
        abort_if($token === '' || ! hash_equals($token, (string) $request->header('x-callback-token')), 403, 'Invalid callback token.');

        $invoice = $request->validate(['id' => ['required', 'string'], 'external_id' => ['required', 'string'], 'status' => ['required', 'string']]);

        // Both ids must agree; a webhook never creates a booking.
        $booking = TableBooking::where('xendit_invoice_id', $invoice['id'])->where('code', $invoice['external_id'])->first();
        abort_unless($booking, 404, 'No booking matches that invoice.');

        $booking->applyInvoiceStatus($invoice['status']);

        return response()->json(['message' => 'OK']);
    }
}
