<?php

namespace App\Http\Controllers;

use App\Enums\StaffStatus;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        // Sanctum only starts a session for first-party origins; without one there is nothing to sign in to.
        abort_unless($request->hasSession(), 419, 'Your session expired. Reload the page and sign in again.');

        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        // Password first: an account's status is only revealed to someone who knows its password.
        // Invited accounts have no password yet, so they fail here like an unknown email.
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => "That email and password don't match."]);
        }

        abort_if($user->status !== StaffStatus::Active, 403, 'This account has been disabled. Ask a manager to enable it.');

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $user->forceFill(['last_active_at' => now()])->save();

        return $this->me($request);
    }

    /**
     * F15: the person behind an invite or reset link sets their own password. They sign in afterwards on /login.
     * A used link is stamped expired rather than forgotten, so using it twice is 410, like a link that ran out.
     */
    public function acceptInvite(Request $request, string $token): JsonResponse
    {
        return DB::transaction(function () use ($request, $token) {
            $user = User::where('invite_token_hash', hash('sha256', $token))->lockForUpdate()->first()
                ?? abort(404, "This invite link isn't valid.");

            // A disabled account can't come back through an old reset link; a manager enables it first.
            abort_if($user->status === StaffStatus::Disabled || ! $user->invite_expires_at->isFuture(), 410,
                'This invite link has expired. Ask a manager for a new one.');

            $data = $request->validate(
                ['password' => ['required', 'string', 'min:10', 'max:255', 'confirmed']],
                ['password.confirmed' => "The two passwords don't match.", 'password' => 'Use at least 10 characters.'],
            );

            $user->forceFill(['password' => $data['password'], 'status' => StaffStatus::Active, 'invite_expires_at' => now()])->save();

            return response()->json(['email' => $user->email, 'role' => $user->role]);
        });
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->only(['id', 'name', 'email', 'role']));
    }
}
