<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Usage: role:manager, or role:door,manager. Runs after auth:sanctum, so the user is known. */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        abort_unless(in_array($request->user()->role->value, $roles, true), 403, 'Only managers can do this.');

        return $next($request);
    }
}
