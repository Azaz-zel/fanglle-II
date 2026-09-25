<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\PassKind;
use App\Mail\TableBooked;
use App\Support\Xendit;
use Closure;
use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

#[Unguarded]
class TableBooking extends Model
{
    private const PAID = ['PAID', 'SETTLED'];

    protected function casts(): array
    {
        return ['status' => BookingStatus::class, 'held_until' => 'datetime', 'paid_at' => 'datetime'];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function venueTable(): BelongsTo
    {
        return $this->belongsTo(VenueTable::class);
    }

    public function pass(): HasOne
    {
        return $this->hasOne(Pass::class);
    }

    /** The guest's key to this booking, derived instead of stored: HMAC of the code with APP_KEY. */
    public function secret(): string
    {
        return substr(rtrim(strtr(base64_encode(hash_hmac('sha256', 'booking:'.$this->code, config('app.key'), true)), '+/', '-_'), '='), 0, 22);
    }

    /** A wrong or missing key looks exactly like a code that doesn't exist, so codes can't be probed. */
    public static function forGuest(string $code, mixed $key): self
    {
        $booking = static::where('code', $code)->first();
        abort_unless($booking && is_string($key) && hash_equals($booking->secret(), $key), 404, "We couldn't find that booking.");

        return $booking;
    }

    /** F5: holds past held_until go back to the floor. A single conditional UPDATE, so it is idempotent and waits on any webhook holding the row. */
    public static function releaseExpired(?Closure $scope = null): int
    {
        return static::where('status', BookingStatus::Held)
            ->where('held_until', '<=', now())
            ->when($scope, $scope)
            ->update(['status' => BookingStatus::Released]);
    }

    /**
     * The only way an invoice status changes a booking: webhook, polling fallback and release all come here (F7).
     * Row lock first, then the (invoice, status) record, so a status is acted on once however often it arrives.
     */
    public function applyInvoiceStatus(string $status): void
    {
        DB::transaction(function () use ($status) {
            $booking = static::lockForUpdate()->find($this->id);

            // A hold with no invoice yet (mid-creation) has no invoice status to record.
            $first = ! $booking->xendit_invoice_id || DB::table('webhook_events')->insertOrIgnore([
                'invoice_id' => $booking->xendit_invoice_id, 'status' => $status, 'created_at' => now(), 'updated_at' => now(),
            ]);
            if (! $first) {
                return;
            }

            if ($booking->status !== BookingStatus::Held) {
                if (in_array($status, self::PAID, true) && $booking->status === BookingStatus::Released) {
                    Log::warning('Xendit reports a payment for a released table booking. Refund it by hand.', ['code' => $booking->code, 'invoice' => $booking->xendit_invoice_id]);
                }

                return;
            }

            if (in_array($status, self::PAID, true)) {
                $booking->update(['status' => BookingStatus::Paid, 'paid_at' => now()]);
                $pass = $booking->pass()->create([
                    'event_id' => $booking->event_id, 'kind' => PassKind::Table, 'holder_name' => $booking->name, 'people' => $booking->party_size,
                ]);
                Mail::to($booking->email)->queue(new TableBooked($pass));
            } elseif ($status === 'EXPIRED') {
                $booking->update(['status' => BookingStatus::Released]);
            }
        });

        $this->refresh();
    }

    /**
     * Guest (and later manager) lets a held table go. The invoice is killed first, so it can never be paid
     * for a table that someone else then gets (F5). Already released is fine; paid is never refunded (F6).
     */
    public function release(): void
    {
        if ($this->status === BookingStatus::Held) {
            $status = $this->xendit_invoice_id ? Xendit::expireInvoice($this->xendit_invoice_id) : 'EXPIRED';
            abort_unless(in_array($status, ['EXPIRED', ...self::PAID], true), 502, "Couldn't cancel the payment. Please try again.");
            $this->applyInvoiceStatus($status);
        }

        abort_unless($this->status === BookingStatus::Released, 409, "This table is already paid. Deposits aren't refunded.");
    }

    /** Polling fallback for a late webhook, at most one Xendit call per booking every 10 seconds. */
    public function syncWithXendit(): void
    {
        if ($this->status !== BookingStatus::Held) {
            return;
        }

        if (! $this->held_until->isFuture()) {
            static::releaseExpired(fn ($q) => $q->whereKey($this->id));
            $this->refresh();
        } elseif ($this->xendit_invoice_id && cache()->add("xendit-poll:{$this->id}", true, 10)) {
            $status = Xendit::invoiceStatus($this->xendit_invoice_id);
            if (in_array($status, ['EXPIRED', ...self::PAID], true)) {
                $this->applyInvoiceStatus($status);
            }
        }
    }
}
