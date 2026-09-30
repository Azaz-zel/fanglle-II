<?php

namespace App\Models;

use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Mail\StaffInvite;
use App\Policies\StaffPolicy;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token', 'invite_token_hash', 'invite_token'])]
#[UsePolicy(StaffPolicy::class)]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => StaffRole::class,
            'status' => StaffStatus::class,
            'invite_expires_at' => 'datetime',
            'last_active_at' => 'datetime',
            'invite_token' => 'encrypted',
        ];
    }

    /**
     * F15: invites and resets share one link to /invite/{token}. The hash finds the account; a new link replaces the old
     * one, so a resent invite stops the earlier email from working. A new member's link is also kept encrypted, for the
     * Team page's "Copy link"; a reset link never is.
     */
    public function sendPasswordLink(bool $reset = false): void
    {
        $token = Str::random(40);
        $this->forceFill([
            'invite_token_hash' => hash('sha256', $token),
            'invite_token' => $reset ? null : $token,
            'invite_expires_at' => now()->addHours(48),
        ])->save();

        Mail::to($this->email)->queue(new StaffInvite($this->name, $this->role, $this->inviteUrl($token), $reset));
    }

    /** The link a pending invite can still be accepted with, or null. */
    public function inviteUrl(?string $token = null): ?string
    {
        $token ??= $this->status === StaffStatus::Invited && $this->invite_expires_at?->isFuture() ? $this->invite_token : null;

        return $token ? rtrim(config('app.url'), '/').'/invite/'.$token : null;
    }

    /** T-A6: every session of this account ends now, not when it would have expired. */
    public function signOutEverywhere(): void
    {
        DB::table('sessions')->where('user_id', $this->id)->delete();
        $this->forceFill(['remember_token' => null])->save();
    }
}
