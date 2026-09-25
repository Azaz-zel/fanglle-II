<?php

namespace App\Models;

use App\Enums\PassKind;
use App\Support\EntryCode;
use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Unguarded]
class Pass extends Model
{
    protected function casts(): array
    {
        return ['kind' => PassKind::class, 'revoked_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function (Pass $pass) {
            $pass->public_id = (string) Str::ulid();
            do {
                $pass->entry_code = EntryCode::generate();
            } while (static::where('entry_code', $pass->entry_code)->exists());
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function guestlistSignup(): BelongsTo
    {
        return $this->belongsTo(GuestlistSignup::class);
    }

    public function tableBooking(): BelongsTo
    {
        return $this->belongsTo(TableBooking::class);
    }

    public function url(): string
    {
        return '/p/'.$this->public_id;
    }
}
