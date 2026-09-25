<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Model;

class TableBooking extends Model
{
    protected function casts(): array
    {
        return ['status' => BookingStatus::class, 'held_until' => 'datetime', 'paid_at' => 'datetime'];
    }
}
