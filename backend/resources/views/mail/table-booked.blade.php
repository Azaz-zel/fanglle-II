<x-mail::message>
# Your table is booked

Hi {{ $booking->name }}, your deposit is paid and table {{ $booking->venueTable->code }} is yours for **{{ $event->name }}** on {{ $event->date->format('l j F Y') }}.

Show this QR at the door:

<x-mail::button :url="$passUrl">
Open your QR
</x-mail::button>

If the QR won't scan, give the door this code: **{{ $entryCode }}**

<x-mail::table>
| | |
|:--|--:|
| Table | {{ $booking->venueTable->code }}, up to {{ $booking->party_size }} {{ $booking->party_size === 1 ? 'person' : 'people' }} |
| Deposit paid | {{ $idr($booking->deposit) }} |
| Minimum spend | {{ $idr($booking->min_spend) }} |
| Left to spend on the night | {{ $idr($booking->min_spend - $booking->deposit) }} |
</x-mail::table>

The deposit counts toward your minimum spend. It isn't refunded if you cancel or don't come.

Everyone in your group must be 21 or over and bring ID.

{{ config('app.name') }}
</x-mail::message>
