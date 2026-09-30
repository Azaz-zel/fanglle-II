<?php

namespace App\Models;

use App\Enums\CheckInMethod;
use App\Enums\PassKind;
use App\Support\EntryCode;
use App\Support\Night;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Symfony\Component\Uid\Ulid;

#[Unguarded]
class Pass extends Model
{
    /** A scan this recent reached the server while the door had signal. */
    public const ONLINE_SCAN_SECONDS = 120;

    protected function casts(): array
    {
        return ['kind' => PassKind::class, 'revoked_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function (Pass $pass) {
            $pass->public_id = self::newPublicId();
            do {
                $pass->entry_code = EntryCode::generate();
            } while (static::where('entry_code', $pass->entry_code)->exists());
        });
    }

    /**
     * The link is the credential. A plain ULID made in the same millisecond is the last one plus 1, so a guest with one QR of
     * a group could count to a friend's: keep the time part, draw all 80 random bits fresh.
     */
    public static function newPublicId(): string
    {
        return (string) Ulid::fromBinary(substr(Str::ulid()->toBinary(), 0, 6).random_bytes(10));
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

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class)->orderBy('scanned_at')->orderBy('id');
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

    /**
     * Dokumen 1: a cancelled pass is refused when it is scanned online. An older scan is a door syncing after
     * losing signal: that person is already inside, so it is recorded (as a conflict) instead. Overrides go through.
     */
    public function refusesScan(CarbonInterface $scannedAt, CheckInMethod $method): bool
    {
        return $this->revoked_at !== null && $method !== CheckInMethod::Override
            && $scannedAt->gte(now()->subSeconds(self::ONLINE_SCAN_SECONDS));
    }

    /** One pass as a door device keeps it: the last 4 phone digits only (F14), and the code's hash, never the code (F17). */
    public function manifestItem(): array
    {
        $booking = $this->tableBooking;

        return [
            'public_id' => $this->public_id,
            'kind' => $this->kind,
            'holder_name' => $this->holder_name,
            'people' => $this->people,
            'inside_count' => $this->inside_count,
            'phone_last4' => substr(($this->guestlistSignup ?? $booking)?->phone ?? '', -4) ?: null,
            'table_code' => $booking?->venueTable->code,
            'revoked' => $this->revoked_at !== null,
            'entry_code_hash' => hash('sha256', $this->entry_code), // entry_code is stored normalized
        ];
    }
}
