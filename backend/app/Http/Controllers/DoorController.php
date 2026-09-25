<?php

namespace App\Http\Controllers;

use App\Support\PassSigner;
use Illuminate\Http\JsonResponse;

class DoorController extends Controller
{
    /** F10: door devices keep this to verify QRs without signal. The private key never leaves the server. */
    public function publicKey(): JsonResponse
    {
        return response()->json((new PassSigner)->publicJwk());
    }
}
