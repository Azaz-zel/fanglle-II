<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d'];
    }

    public function lineupSlots(): HasMany
    {
        return $this->hasMany(LineupSlot::class)->orderBy('position');
    }
}
