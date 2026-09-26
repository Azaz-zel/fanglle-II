<?php

namespace App\Policies;

use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * F15, the one place the team rules live: nobody changes their own account here, and there is always an active manager.
 * Refusals are 422, not 403: the manager may manage the team, this particular change is what breaks a rule.
 * StaffController calls these with the staff table locked, so two managers can't each remove the other.
 */
class StaffPolicy
{
    public function changeRole(User $me, User $staff, StaffRole $role): Response
    {
        return $this->notYou($me, $staff)
            ?? ($role === StaffRole::Manager ? null : $this->notTheLastManager($staff))
            ?? Response::allow();
    }

    public function disable(User $me, User $staff): Response
    {
        return $this->notYou($me, $staff)
            ?? $this->only($staff, StaffStatus::Active)
            ?? $this->notTheLastManager($staff)
            ?? Response::allow();
    }

    public function enable(User $me, User $staff): Response
    {
        return $this->only($staff, StaffStatus::Disabled) ?? Response::allow();
    }

    public function resetPassword(User $me, User $staff): Response
    {
        return $this->notYou($me, $staff) ?? $this->only($staff, StaffStatus::Active) ?? Response::allow();
    }

    public function resendInvite(User $me, User $staff): Response
    {
        return $this->only($staff, StaffStatus::Invited) ?? Response::allow();
    }

    public function cancelInvite(User $me, User $staff): Response
    {
        return $this->only($staff, StaffStatus::Invited) ?? Response::allow();
    }

    private function notYou(User $me, User $staff): ?Response
    {
        return $me->is($staff) ? Response::denyWithStatus(422, "You can't change your own account. Ask another manager.") : null;
    }

    private function only(User $staff, StaffStatus $status): ?Response
    {
        return $staff->status === $status ? null : Response::denyWithStatus(422, match ($status) {
            StaffStatus::Active => 'Only an active account can do that.',
            StaffStatus::Disabled => 'Only a disabled account can be enabled.',
            StaffStatus::Invited => 'This invite has already been accepted.',
        });
    }

    private function notTheLastManager(User $staff): ?Response
    {
        $last = $staff->role === StaffRole::Manager && $staff->status === StaffStatus::Active
            && ! User::where('role', StaffRole::Manager)->where('status', StaffStatus::Active)->whereKeyNot($staff->id)->exists();

        return $last ? Response::denyWithStatus(422, 'Keep at least one active manager. Make someone else a manager first.') : null;
    }
}
