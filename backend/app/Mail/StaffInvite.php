<?php

namespace App\Mail;

use App\Enums\StaffRole;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * F15: the link to set a password, for a new invite or a manager's reset.
 * Encrypted on the queue, because the link carries the raw token and only its hash may be stored.
 */
class StaffInvite extends Mailable implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

    public function __construct(public string $name, public StaffRole $role, public string $url, public bool $reset = false)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->reset
            ? 'Set a new password for '.config('app.name')
            : "You're invited to the team at ".config('app.name'));
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.staff-invite', with: [
            'roleLabel' => $this->role === StaffRole::Manager ? 'Manager' : 'Door staff',
        ]);
    }
}
