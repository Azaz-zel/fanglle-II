<?php

use App\Http\Middleware\EnsureActive;
use App\Http\Middleware\EnsureRole;
use App\Models\Event;
use App\Models\GuestlistSignup;
use App\Models\Pass;
use App\Models\TableBooking;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->alias(['role' => EnsureRole::class]);
        // The role check runs before records are looked up, so door staff get 403 on admin routes, never a 404 that confirms a booking code.
        $middleware->prependToPriorityList(SubstituteBindings::class, EnsureRole::class);
        // A disabled account is signed out (401) before its role is looked at (T-A6).
        $middleware->prependToPriorityList(EnsureRole::class, EnsureActive::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Two saves racing past validation: the database kept one, so the other is a state conflict, not a crash.
        $exceptions->render(fn (UniqueConstraintViolationException $e, Request $request) => $request->is('api/*')
            ? response()->json(['message' => 'That changed while you were saving. Reload and try again.'], 409)
            : null);

        // Dokumen 0 §2.4: API errors are { message } even in debug mode. 401 and 422 already have that shape.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            // Missing records would otherwise say "No query results for model [App\Models\...]".
            $message = match ($e->getPrevious() instanceof ModelNotFoundException ? $e->getPrevious()->getModel() : null) {
                null => $e->getMessage(),
                Event::class => "There's no event on that night.",
                Pass::class => "We couldn't find that pass.",
                TableBooking::class => "We couldn't find that booking.",
                GuestlistSignup::class => "We couldn't find that signup.",
                User::class => "We couldn't find that account.",
                default => 'Not found.',
            };

            return response()->json(['message' => $message], $e->getStatusCode(), $e->getHeaders());
        });
    })->create();
