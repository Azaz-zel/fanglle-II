<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TableBookingController;
use App\Http\Controllers\XenditWebhookController;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Guests (F1) and Xendit carry no session: no CSRF round-trip for guests, and no session read
// (a database query) before the webhook token is checked (F7).
Route::withoutMiddleware(EnsureFrontendRequestsAreStateful::class)->group(function () {
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event:date}', [EventController::class, 'show']);
    Route::get('/events/{event:date}/tables', [EventController::class, 'tables']);

    Route::post('/table-bookings', [TableBookingController::class, 'store']);
    Route::get('/table-bookings/{code}', [TableBookingController::class, 'show']);
    Route::post('/table-bookings/{code}/release', [TableBookingController::class, 'release']);

    Route::post('/webhooks/xendit', XenditWebhookController::class);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:manager')->prefix('admin')->group(function () {
        Route::get('/events', [Admin\EventController::class, 'index']);
        Route::post('/events', [Admin\EventController::class, 'store']);
        Route::get('/events/{event:date}', [Admin\EventController::class, 'show']);
        Route::put('/events/{event:date}', [Admin\EventController::class, 'update']);
    });
});
