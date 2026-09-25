<x-mail::message>
# You're on the guestlist

Hi {{ $signup->name }}, you're on the list for **{{ $event->name }}** on {{ $event->date->format('l j F Y') }}. Guestlist entry is free until {{ $cutoff }}.

@if (count($passes) === 1)
Show this QR at the door. It lets in {{ $passes[0]['people'] }} {{ $passes[0]['people'] === 1 ? 'person' : 'people' }}.
@else
There is one QR per person. Send each guest their own link.
@endif

@foreach ($passes as $pass)
**{{ $pass['name'] }}**{{ $pass['people'] > 1 ? ', group of '.$pass['people'] : '' }}
[Open the QR]({{ $pass['url'] }}) · If it won't scan, give the door this code: **{{ $pass['code'] }}**

@endforeach
Everyone must be 21 or over and bring ID.

{{ config('app.name') }}
</x-mail::message>
