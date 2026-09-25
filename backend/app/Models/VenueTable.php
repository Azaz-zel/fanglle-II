<?php

namespace App\Models;

use App\Enums\TableShape;
use App\Enums\Zone;
use Illuminate\Database\Eloquent\Model;

class VenueTable extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['zone' => Zone::class, 'shape' => TableShape::class];
    }
}
