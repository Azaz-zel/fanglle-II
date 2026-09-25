<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Event;
use App\Models\TableBooking;
use App\Models\VenueTable;
use App\Rules\Turnstile;
use App\Support\EntryCode;
use App\Support\Night;
use App\Support\Xendit;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TableBookingController extends Controller
{
    // F5: the table is held 15 minutes and the invoice dies a minute earlier,
    // so a payment can never land on a table that was given to someone else.
    private const HOLD_SECONDS = 900;

    private const INVOICE_SECONDS = 840;

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'table_code' => ['required', 'string', 'exists:venue_tables,code'],
            'party_size' => ['required', 'integer', 'min:1', 'max:255'],
            'name' => ['required', 'string', 'max:80'],
            'phone' => ['required', 'string', 'regex:/^\+?[0-9\s-]{9,16}$/'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'age_confirmed' => ['accepted'],
            'turnstile_token' => [new Turnstile],
        ], [
            'date' => 'Choose a night.',
            'table_code' => 'Choose a table on the plan.',
            'party_size' => 'Enter how many people are coming.',
            'name.required' => 'Enter the name for the booking.',
            'phone' => 'Enter your phone number. The door uses it to find your booking.',
            'email' => 'Enter your email. Your QR is sent there.',
            'age_confirmed' => 'Everyone in the group must be 21 or over.',
        ]);

        $event = Event::where('date', $data['date'])->first()
            ?? throw ValidationException::withMessages(['date' => "There's no event on that night."]);
        if (now()->gte(Night::at($data['date'], $event->close_time))) {
            throw ValidationException::withMessages(['date' => 'Bookings for that night have closed.']);
        }

        $table = VenueTable::where('code', $data['table_code'])->first();
        if ($table->capacity < $data['party_size']) {
            throw ValidationException::withMessages(['party_size' => "{$table->code} seats {$table->capacity}. Choose a bigger table or a smaller group."]);
        }

        $minSpend = $event->minSpend()[$table->zone->value];
        $booking = $this->hold($event, $table, [
            'status' => BookingStatus::Held,
            'name' => $data['name'],
            'phone' => preg_replace('/[\s-]+/', '', $data['phone']),
            'email' => $data['email'],
            'party_size' => $data['party_size'],
            'min_spend' => $minSpend,
            'deposit' => intdiv($minSpend, 2),   // F6
            'held_until' => now()->addSeconds(self::HOLD_SECONDS),
        ]);

        // Outside any transaction: the table is already ours, and a slow payment provider must not hold row locks.
        $invoice = rescue(fn () => Xendit::createInvoice($this->invoice($booking, $event, $table)));
        if (! isset($invoice['id'], $invoice['invoice_url'])) {
            $booking->update(['status' => BookingStatus::Released]);
            abort(502, "Payment couldn't start. Please try again.");
        }
        $booking->update(['xendit_invoice_id' => $invoice['id'], 'xendit_invoice_url' => $invoice['invoice_url']]);

        return response()->json([
            'code' => $booking->code,
            'secret' => $booking->secret(),
            'held_until' => $booking->held_until->toIso8601String(),
            'deposit' => $booking->deposit,
            'min_spend' => $booking->min_spend,
            'payment_url' => $booking->xendit_invoice_url,
        ], 201);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $booking = TableBooking::forGuest($code, $request->query('k'));
        $booking->syncWithXendit();

        return response()->json([
            'status' => $booking->status,
            'held_until' => $booking->held_until->toIso8601String(),
            'pass_url' => $booking->status === BookingStatus::Paid ? $booking->pass->url() : null,
        ]);
    }

    public function release(Request $request, string $code): JsonResponse
    {
        TableBooking::forGuest($code, $request->query('k'))->release();

        return response()->json(['status' => BookingStatus::Released]);
    }

    /** F4: the unique (event, active table) index decides who gets the table, not this code. */
    private function hold(Event $event, VenueTable $table, array $attributes): TableBooking
    {
        // A hold that ran out still occupies the index until released; S2 already shows it as free.
        // Own statement, not a wider transaction, so racing requests don't deadlock on its gap locks.
        TableBooking::releaseExpired(fn ($q) => $q->where('event_id', $event->id)->where('venue_table_id', $table->id));

        do {
            $code = 'F2-'.EntryCode::generate(4);
        } while (TableBooking::where('code', $code)->exists());

        try {
            return TableBooking::create(['code' => $code, 'event_id' => $event->id, 'venue_table_id' => $table->id] + $attributes);
        } catch (UniqueConstraintViolationException $e) {
            abort_if(str_contains($e->getMessage(), 'active_table_id'), 409, 'That table was just taken.');
            throw $e;
        }
    }

    private function invoice(TableBooking $booking, Event $event, VenueTable $table): array
    {
        $back = rtrim(config('app.url'), '/')."/booking/{$booking->code}?k={$booking->secret()}";

        return [
            'external_id' => $booking->code,
            'amount' => $booking->deposit,
            'currency' => 'IDR',
            'invoice_duration' => self::INVOICE_SECONDS,
            'description' => "Deposit for table {$table->code}, {$event->name}, {$event->date->format('D j M')}",
            'customer' => ['given_names' => $booking->name, 'email' => $booking->email],
            'success_redirect_url' => $back,
            'failure_redirect_url' => $back,
        ];
    }
}
