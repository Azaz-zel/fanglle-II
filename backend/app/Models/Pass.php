<?php

namespace App\Models;

use App\Enums\PassKind;
use App\Support\EntryCode;
use App\Support\Night;
use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Builder;
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

    /** F17: however the code was typed, normalize first, then an exact match. */
    public function scopeWithEntryCode(Builder $query, string $typed): void
    {
        $query->where('entry_code', EntryCode::normalize($typed));
    }

    /**
     * ready | partial | used | expired | revoked, first match wins. A guestlist QR stops at the guestlist
     * cutoff ("Free entry ended at 11 pm" in the QR and door mockups); a table QR is valid all night.
     */
    public function status(): string
    {
        $until = $this->kind === PassKind::Table ? $this->event->close_time : $this->event->guestlist_cutoff;

        return match (true) {
            $this->revoked_at !== null => 'revoked',
            $this->inside_count >= $this->people => 'used',
            now()->gte(Night::at($this->event->date->toDateString(), $until)) => 'expired',
            $this->inside_count > 0 => 'partial',
            default => 'ready',
        };
    }
}
