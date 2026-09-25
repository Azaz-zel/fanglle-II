<?php

namespace App\Models;

use App\Enums\QrMode;
use Illuminate\Database\Eloquent\Model;

class GuestlistSignup extends Model
{
    protected function casts(): array
    {
        return ['qr_mode' => QrMode::class, 'removed_at' => 'datetime'];
    }
}
