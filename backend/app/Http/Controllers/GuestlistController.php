<?php

namespace App\Http\Controllers;

use App\Enums\PassKind;
use App\Enums\QrMode;
use App\Mail\GuestlistPasses;
use App\Models\Event;
use App\Models\GuestlistSignup;
use App\Rules\Turnstile;
use App\Support\GuestContact;
use App\Support\Night;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GuestlistController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // guest_names are everyone except the organiser. Personal QRs carry a name each (F9), so all are required.
        $personal = $request->input('qr_mode') === QrMode::Personal->value;
        $others = max(0, min(9, (int) $request->input('party_size')) - 1);
        $nameRules = $nameMessages = [];
        for ($i = 0; $personal && $i < $others; $i++) {
            $nameRules["guest_names.$i"] = ['required', 'string', 'max:80'];
            $nameMessages["guest_names.$i.required"] = 'Enter guest '.($i + 2)."'s name. Each QR carries one name.";
        }

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'party_size' => ['required', 'integer', 'between:1,10'],
            'qr_mode' => ['required', Rule::enum(QrMode::class)],
            ...GuestContact::rules(),
            'guest_names' => ['nullable', 'array', 'max:9'],
            'guest_names.*' => ['nullable', 'string', 'max:80'],
            ...$nameRules,
        ], [
            'date' => 'Choose a night.',
            'party_size' => 'Choose between 1 and 10 people.',
            'qr_mode' => 'Choose one QR for the group, or one for each person.',
            'name.required' => 'Enter your name as it appears on your ID.',
            'phone' => 'Enter your phone number. The door uses it to find you on the list.',
            ...GuestContact::messages(),
            ...$nameMessages,
        ]);

        $event = Event::where('date', $data['date'])->first()
            ?? throw ValidationException::withMessages(['date' => "There's no event on that night."]);
        $party = (int) $data['party_size'];

        $signup = DB::transaction(function () use ($event, $data, $party, $personal) {
            // F8: one lock per night, so two signups can't both take the last places.
            $event = Event::lockForUpdate()->find($event->id);

            if (now()->gte(Night::at($data['date'], $event->guestlist_cutoff))) {
                throw ValidationException::withMessages(['date' => "The guestlist for {$event->name} closed at ".Night::spoken($event->guestlist_cutoff).'.']);
            }

            $left = max(0, $event->guestlist_quota - (int) $event->activeSignups()->sum('party_size'));
            if ($party > $left) {
                $message = $left === 0
                    ? "The guestlist for {$event->name} is full. Choose another night."
                    : 'Only '.$left.' '.($left === 1 ? 'place' : 'places')." left on {$event->name}. Make your group smaller, or choose another night.";
                throw new HttpResponseException(response()->json(['message' => $message, 'errors' => ['party_size' => [$message]], 'places_left' => $left], 422));
            }

            try {
                $signup = GuestlistSignup::create([
                    'event_id' => $event->id, 'name' => $data['name'], 'phone' => GuestContact::phone($data['phone']),
                    'email' => $data['email'], 'party_size' => $party, 'qr_mode' => $data['qr_mode'],
                ]);
            } catch (UniqueConstraintViolationException) {
                abort(409, 'This number is already on the list for that night.');
            }

            $holders = $personal
                ? [[$data['name'], 1], ...array_map(fn ($name) => [$name, 1], array_slice($data['guest_names'], 0, $party - 1))]
                : [[$data['name'], $party]];
            foreach ($holders as [$name, $people]) {
                $signup->passes()->create(['event_id' => $event->id, 'kind' => PassKind::from($data['qr_mode']), 'holder_name' => $name, 'people' => $people]);
            }

            Mail::to($signup->email)->queue(new GuestlistPasses($signup));

            return $signup;
        });

        return response()->json(['passes' => $signup->passes->map(fn ($pass) => ['holder_name' => $pass->holder_name, 'pass_url' => $pass->url()])], 201);
    }

    public function resend(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'phone' => GuestContact::PHONE,
            'turnstile_token' => [new Turnstile],
        ], [
            'date' => 'Choose a night.',
            'phone' => 'Enter the phone number you signed up with.',
        ]);

        $signup = GuestlistSignup::whereNull('removed_at')
            ->where('phone', GuestContact::phone($data['phone']))
            ->whereRelation('event', 'date', $data['date'])
            ->first();
        abort_unless($signup, 404, "That number isn't on the list for that night.");

        $signup->resend();

        return response()->json(['message' => 'We sent your QR again to the email you signed up with.']);
    }
}
