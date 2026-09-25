<?php

namespace App\Models;

use App\Enums\CheckInMethod;
use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;

#[Unguarded]
class CheckIn extends Model
{
    protected function casts(): array
    {
        return ['method' => CheckInMethod::class, 'conflict' => 'boolean', 'scanned_at' => 'datetime'];
    }

    public function pass(): BelongsTo
    {
        return $this->belongsTo(Pass::class);
    }

    /** The staff member who let them in. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * One door check-in, in its own transaction. The same client_uuid again counts once (F12). Going past
     * `people`, or a cancelled pass synced from a door without signal, is recorded with conflict: they are inside (F11, F12).
     *
     * @param  array{client_uuid: string, public_id: string, count: int, method: string, scanned_at: string}  $item
     * @return array{client_uuid: string, inside_count?: int, conflict?: bool, error?: 'unknown_pass'|'revoked'}
     */
    public static function record(User $staff, array $item): array
    {
        $uuid = $item['client_uuid'];
        $method = CheckInMethod::from($item['method']);
        // The cast would store the wall-clock digits of whatever zone the device sent, so convert first.
        $scannedAt = Date::parse($item['scanned_at'])->setTimezone(config('app.timezone'));

        try {
            return DB::transaction(function () use ($staff, $item, $uuid, $method, $scannedAt) {
                if ($done = static::firstWhere('client_uuid', $uuid)) {
                    return $done->result();
                }

                $pass = Pass::where('public_id', $item['public_id'])->lockForUpdate()->first();
                if (! $pass) {
                    return ['client_uuid' => $uuid, 'error' => 'unknown_pass'];
                }
                if ($pass->refusesScan($scannedAt, $method)) {
                    return ['client_uuid' => $uuid, 'error' => 'revoked'];
                }

                $pass->increment('inside_count', $item['count']); // bumps updated_at, so the next manifest ?since= carries it

                return static::create([
                    'client_uuid' => $uuid, 'pass_id' => $pass->id, 'user_id' => $staff->id, 'count' => $item['count'],
                    'method' => $method, 'scanned_at' => $scannedAt,
                    'conflict' => $pass->revoked_at !== null || $pass->inside_count > $pass->people,
                ])->setRelation('pass', $pass)->result();
            });
        } catch (UniqueConstraintViolationException) {
            return static::firstWhere('client_uuid', $uuid)->result(); // the same uuid arrived twice at once; the other one counted
        }
    }

    /** What the door gets back, the first time and every repeat. */
    private function result(): array
    {
        return ['client_uuid' => $this->client_uuid, 'inside_count' => $this->pass->inside_count, 'conflict' => $this->conflict];
    }
}
