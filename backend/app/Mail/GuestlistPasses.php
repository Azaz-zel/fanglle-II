<?php

namespace App\Mail;

use App\Models\GuestlistSignup;
use App\Support\EntryCode;
use App\Support\Night;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** F13: every QR of a signup goes to the organiser, because only the organiser gives an email. */
class GuestlistPasses extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public GuestlistSignup $signup)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        $event = $this->signup->event;
        $qrs = $this->signup->passes->count() === 1 ? 'QR' : 'QRs';

        return new Envelope(subject: "Your guestlist {$qrs} for {$event->name}, {$event->date->format('D j M')}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.guestlist-passes', with: [
            'signup' => $this->signup,
            'event' => $this->signup->event,
            'cutoff' => Night::spoken($this->signup->event->guestlist_cutoff),
            'passes' => $this->signup->passes->map(fn ($pass) => [
                'name' => $pass->holder_name,
                'people' => $pass->people,
                'url' => rtrim(config('app.url'), '/').$pass->url(),
                'code' => EntryCode::format($pass->entry_code),
            ]),
        ]);
    }
}
