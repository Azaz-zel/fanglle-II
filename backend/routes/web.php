<?php

use Illuminate\Support\Facades\Route;

// Every page is the React build (Vite base /app/); api/* and sanctum/* stay out so their misses are real 404s, not 405s.
Route::get('{path?}', function () {
    $index = public_path('app/index.html');
    abort_unless(is_file($index), 404);

    // no-cache: a stale index.html would point at hashed assets a new build has deleted.
    return response()->file($index, ['Content-Type' => 'text/html; charset=utf-8', 'Cache-Control' => 'no-cache']);
})->where('path', '(?!(api|sanctum)(/|$)).*');
