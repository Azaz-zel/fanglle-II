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
#[Hidden(['password', 'remember_token', 'invite_token_hash'])]
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
        ];
    }

    /**
     * F15: invites and resets share one link to /invite/{token}. Only the token's hash is stored, and a new link
     * replaces the old one, so a resent invite stops the earlier email from working.
     */
    public function sendPasswordLink(bool $reset = false): void
    {
        $token = Str::random(40);
        $this->forceFill(['invite_token_hash' => hash('sha256', $token), 'invite_expires_at' => now()->addHours(48)])->save();

        Mail::to($this->email)->queue(new StaffInvite($this->name, $this->role, rtrim(config('app.url'), '/').'/invite/'.$token, $reset));
    }

    /** T-A6: every session of this account ends now, not when it would have expired. */
    public function signOutEverywhere(): void
    {
        DB::table('sessions')->where('user_id', $this->id)->delete();
        $this->forceFill(['remember_token' => null])->save();
    }
}
