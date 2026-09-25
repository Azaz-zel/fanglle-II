<?php

namespace App\Models;

use App\Enums\LineupRole;
use Illuminate\Database\Eloquent\Model;

class LineupSlot extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['role' => LineupRole::class];
    }
}
