<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// B10.1: on every response, pages and API alike.
class SecurityHeaders
{
    // Turnstile (F16) loads its script and iframe from challenges.cloudflare.com. 'unsafe-inline' is for React style attributes only, never scripts.
    private const CSP = "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; "
        ."connect-src 'self' https://challenges.cloudflare.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; "
        ."worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->add([
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            // The booking secret k (URL of /booking) and pass ids must not leak to Xendit or wa.me through Referer.
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            // The door scanner needs the camera.
            'Permissions-Policy' => 'camera=(self), microphone=(), geolocation=()',
            'Content-Security-Policy' => self::CSP,
        ]);
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
