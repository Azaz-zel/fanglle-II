<?php

namespace App\Http\Controllers;

use App\Enums\StaffStatus;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
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

        return $this->me($request);
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
