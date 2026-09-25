<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event:date}', [EventController::class, 'show']);

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
