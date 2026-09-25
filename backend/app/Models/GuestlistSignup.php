<?php

namespace App\Models;

use App\Enums\QrMode;
use App\Mail\GuestlistPasses;
use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

#[Unguarded]
class GuestlistSignup extends Model
{
    public const RESENDS_PER_HOUR = 3;

    protected function casts(): array
    {
        return ['qr_mode' => QrMode::class, 'removed_at' => 'datetime', 'resend_window_at' => 'datetime'];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function passes(): HasMany
    {
        return $this->hasMany(Pass::class)->orderBy('id');
    }

    /** F13: always to the email given at signup, never one from the request, so a QR can't be redirected. */
    public function resend(): void
    {
        DB::transaction(function () {
            $signup = static::lockForUpdate()->find($this->id);

            // Rolling window: it starts at the first resend and lasts an hour.
            if (! $signup->resend_window_at || $signup->resend_window_at->addHour()->lte(now())) {
                $signup->fill(['resend_window_at' => now(), 'resend_count_hour' => 0]);
            }
            abort_if($signup->resend_count_hour >= self::RESENDS_PER_HOUR, 429, 'You can resend 3 times an hour. Try again later.');

            $signup->resend_count_hour++;
            $signup->save();
            Mail::to($signup->email)->queue(new GuestlistPasses($signup));
        });
    }
}
