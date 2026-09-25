<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

/** MySQL TIME comes back as HH:MM:SS; the API speaks HH:MM. */
class HourMinute implements CastsAttributes
{
    public function get($model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null ? null : substr($value, 0, 5);
    }

    public function set($model, string $key, mixed $value, array $attributes): mixed
    {
        return $value;
    }
}
