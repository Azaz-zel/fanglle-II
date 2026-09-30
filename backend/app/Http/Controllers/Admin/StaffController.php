<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** F15. The rules (yourself, the last manager, which status allows what) are all in StaffPolicy. */
class StaffController extends Controller
{
    private const ORDER = [StaffStatus::Active, StaffStatus::Invited, StaffStatus::Disabled];

    public function index(Request $request): JsonResponse
    {
        $staff = User::orderBy('name')->orderBy('id')->get()
            ->sortBy(fn (User $user) => array_search($user->status, self::ORDER, true)); // stable, so names stay in order

        return response()->json(['staff' => $staff->map(fn (User $user) => $this->item($user, $request->user()))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')],
            'role' => ['required', Rule::enum(StaffRole::class)],
        ], [
            'name' => 'Add their name.',
            'email.unique' => 'That email already has an account.',
            'email' => 'Enter a valid email. The invite link goes there.',
            'role' => 'Choose Manager or Door staff.',
        ]);

        $staff = DB::transaction(function () use ($data) {
            $staff = User::forceCreate($data + ['status' => StaffStatus::Invited]);
            $staff->sendPasswordLink();

            return $staff;
        });

        return response()->json($this->item($staff, $request->user()), 201);
    }

    public function update(Request $request, User $staff): JsonResponse
    {
        $role = StaffRole::from($request->validate(
            ['role' => ['required', Rule::enum(StaffRole::class)]],
            ['role' => 'Choose Manager or Door staff.'],
        )['role']);

        return $this->act($request, $staff, 'changeRole', fn () => $staff->forceFill(['role' => $role])->save(), $role);
    }

    public function disable(Request $request, User $staff): JsonResponse
    {
        return $this->act($request, $staff, 'disable', function () use ($staff) {
            $staff->forceFill(['status' => StaffStatus::Disabled])->save();
            $staff->signOutEverywhere();
        });
    }

    public function enable(Request $request, User $staff): JsonResponse
    {
        return $this->act($request, $staff, 'enable', fn () => $staff->forceFill(['status' => StaffStatus::Active])->save());
    }

    /** F15: the manager never sets a password. The old one stops working and the person sets a new one from the email. */
    public function resetPassword(Request $request, User $staff): JsonResponse
    {
        return $this->act($request, $staff, 'resetPassword', function () use ($staff) {
            $staff->forceFill(['password' => null])->save();
            $staff->signOutEverywhere();
            $staff->sendPasswordLink(reset: true);
        });
    }

    public function resendInvite(Request $request, User $staff): JsonResponse
    {
        return $this->act($request, $staff, 'resendInvite', fn () => $staff->sendPasswordLink());
    }

    public function cancelInvite(Request $request, User $staff): Response
    {
        $this->act($request, $staff, 'cancelInvite', fn () => $staff->delete());

        return response()->noContent();
    }

    /**
     * One change at a time across the whole team, so two managers can't each disable or demote the other
     * and leave nobody in charge. The policy then judges the rows as they are now, not as they were loaded.
     */
    private function act(Request $request, User $staff, string $ability, Closure $change, mixed ...$arguments): JsonResponse
    {
        DB::transaction(function () use ($staff, $ability, $change, $arguments) {
            User::lockForUpdate()->pluck('id'); // ponytail: locks every staff row; fine for a team of a few dozen
            Gate::authorize($ability, [$staff->refresh(), ...$arguments]);
            $change();
        });

        return response()->json($this->item($staff, $request->user()));
    }

    private function item(User $user, User $me): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'last_active_at' => $user->last_active_at?->toIso8601String(),
            'invite_expires_at' => $user->invite_expires_at?->toIso8601String(),
            'invite_url' => $user->inviteUrl(), // "Copy link": managers only, pending invites only
            'you' => $user->is($me),
        ];
    }
}
