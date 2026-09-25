<?php

namespace App\Models;

use App\Casts\HourMinute;
use App\Enums\BookingStatus;
use App\Support\Night;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['date', 'name', 'genre', 'blurb', 'guestlist_quota', 'guestlist_cutoff', 'close_time', 'min_spend_stage', 'min_spend_booth', 'min_spend_bar'])]
class Event extends Model
{
    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d', 'guestlist_cutoff' => HourMinute::class, 'close_time' => HourMinute::class];
    }

    // MySQL reads '2026-09-25xyz' as 2026-09-25, so only an exact date finds a night.
    public function resolveRouteBinding($value, $field = null)
    {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? parent::resolveRouteBinding($value, $field) : null;
    }

    public function lineupSlots(): HasMany
    {
        return $this->hasMany(LineupSlot::class)->orderBy('position');
    }

    /** Bookings that keep their table: paid, or held with time left. An expired hold is free even before the scheduler releases it. */
    public function tableHolds(): HasMany
    {
        return $this->hasMany(TableBooking::class)->where(fn ($q) => $q
            ->where('status', BookingStatus::Paid)
            ->orWhere(fn ($q) => $q->where('status', BookingStatus::Held)->where('held_until', '>', now())));
    }

    public function activeSignups(): HasMany
    {
        return $this->hasMany(GuestlistSignup::class)->whereNull('removed_at');
    }

    /** Adds `signed` (people on the guestlist) and `tables_taken`. */
    public function scopeWithAvailability(Builder $query): void
    {
        $query->with('lineupSlots')->withCount('tableHolds as tables_taken')->withSum('activeSignups as signed', 'party_size');
    }

    /** F2: sets are stored in night order, so 00:30 comes after 23:30. */
    public function replaceLineup(array $slots): void
    {
        $this->lineupSlots()->delete();
        $this->lineupSlots()->createMany(
            collect($slots)
                ->sortBy(fn ($slot) => Night::minutes($slot['starts_at']))
                ->values()
                ->map(fn ($slot, $i) => ['position' => $i] + $slot)
                ->all(),
        );
    }

    public function minSpend(): array
    {
        return ['stage' => $this->min_spend_stage, 'booth' => $this->min_spend_booth, 'bar' => $this->min_spend_bar];
    }

    public function lineup(): array
    {
        return $this->lineupSlots->map->only(['performer', 'role', 'starts_at', 'ends_at'])->all();
    }
}
