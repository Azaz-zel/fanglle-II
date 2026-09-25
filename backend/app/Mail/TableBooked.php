<?php

namespace App\Mail;

use App\Models\Pass;
use App\Support\EntryCode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** B3.4: sent once the deposit is paid. Queued after commit, so a rolled-back payment never emails anyone. */
class TableBooked extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Pass $pass)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        $booking = $this->pass->tableBooking;

        return new Envelope(subject: "Your table {$booking->venueTable->code} for {$this->pass->event->name}, {$this->pass->event->date->format('D j M')}");
    }

    public function content(): Content
    {
        $booking = $this->pass->tableBooking;

        return new Content(markdown: 'mail.table-booked', with: [
            'booking' => $booking,
            'event' => $this->pass->event,
            'passUrl' => rtrim(config('app.url'), '/').$this->pass->url(),
            'entryCode' => EntryCode::format($this->pass->entry_code),
            'idr' => fn (int $amount) => 'IDR '.number_format($amount),
        ]);
    }
}
