<x-mail::message>
@if ($reset)
# Set a new password

Hi {{ $name }}, a manager reset your password for {{ config('app.name') }}. Set a new one to sign in again.
@else
# Join the team

Hi {{ $name }}, you've been invited to {{ config('app.name') }} as **{{ $roleLabel }}**. Set your password to sign in.
@endif

<x-mail::button :url="$url">
{{ $reset ? 'Set a new password' : 'Set your password' }}
</x-mail::button>

The link works for 48 hours. If it runs out, ask a manager to send a new one.

{{ config('app.name') }}
</x-mail::message>
