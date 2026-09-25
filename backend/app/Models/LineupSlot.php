<?php

namespace App\Models;

use App\Casts\HourMinute;
use App\Enums\LineupRole;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['performer', 'role', 'starts_at', 'ends_at', 'position'])]
class LineupSlot extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['role' => LineupRole::class, 'starts_at' => HourMinute::class, 'ends_at' => HourMinute::class];
    }
}
