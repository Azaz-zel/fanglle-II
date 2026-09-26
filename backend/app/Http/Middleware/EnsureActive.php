<?php

namespace App\Http\Middleware;

use App\Enums\StaffStatus;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** T-A6 backstop: disabling deletes the sessions, and a session that somehow survives still gets nothing. Runs after auth:sanctum. */
class EnsureActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->status !== StaffStatus::Active) {
            Auth::guard('web')->logout();

            throw new AuthenticationException;
        }

        return $next($request);
    }
}
