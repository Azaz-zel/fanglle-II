<?php

namespace App\Http\Requests;

use App\Enums\LineupRole;
use App\Models\Event;
use App\Support\Night;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/** Create (POST, with date) and edit (PUT, date fixed) share one form. Wording follows the admin mockup. */
class EventRequest extends FormRequest
{
    public function rules(): array
    {
        $event = $this->route('event');

        return [
            ...($event ? [] : ['date' => ['bail', 'required', 'date_format:Y-m-d', function (string $attribute, string $date, Closure $fail) {
                if (Event::where('date', $date)->exists()) {
                    $fail("There's already an event on ".Carbon::parse($date)->format('D j M').'.');
                }
            }]]),
            'name' => ['required', 'string', 'max:80'],
            'genre' => ['nullable', 'string', 'max:60'],
            'blurb' => ['nullable', 'string', 'max:220'],
            'guestlist_quota' => ['bail', 'required', 'integer', 'min:1', 'max:65535', function (string $attribute, mixed $quota, Closure $fail) use ($event) {
                // ponytail: read without a lock; a signup landing mid-save can leave signed above quota, which only shows the list as full.
                $signed = (int) $event?->activeSignups()->sum('party_size');
                if ($quota < $signed) {
                    $fail("At least {$signed}. That many people are already on the list.");
                }
            }],
            'guestlist_cutoff' => ['required', 'date_format:H:i'],
            'close_time' => ['bail', 'required', 'date_format:H:i', function (string $attribute, string $close, Closure $fail) {
                $opens = config('fanglle.night_opens_at');
                if (Night::minutes($close) <= Night::minutes($opens)) {
                    $fail('Closing has to be after the '.Night::spoken($opens).' opening.');
                }
            }],
            'min_spend' => ['required', 'array'],
            'min_spend.stage' => ['required', 'integer', 'min:1'],
            'min_spend.booth' => ['required', 'integer', 'min:1'],
            'min_spend.bar' => ['required', 'integer', 'min:1'],
            'lineup' => ['bail', 'required', 'array', 'max:30', function (string $attribute, array $lineup, Closure $fail) {
                if (! collect($lineup)->contains(fn ($slot) => ($slot['role'] ?? null) === LineupRole::Headliner->value)) {
                    $fail('Mark at least one performer as Headliner.');
                }
            }],
            'lineup.*.performer' => ['required', 'string', 'max:80'],
            'lineup.*.role' => ['required', Rule::enum(LineupRole::class)],
            'lineup.*.starts_at' => ['required', 'date_format:H:i'],
            // Both are strict HH:MM by now, so equal strings mean the same minute.
            'lineup.*.ends_at' => ['required', 'date_format:H:i', 'different:lineup.*.starts_at'],
        ];
    }

    public function messages(): array
    {
        $when = 'Add a start and end time.';
        $amount = 'Enter an amount above zero.';
        $places = 'Enter a whole number of places.';

        return [
            'date.required' => 'Choose the date.',
            'date.date_format' => 'Choose the date.',
            'name.required' => 'Give the night a name.',
            'blurb.max' => 'Keep it under 220 characters.',
            'guestlist_quota.required' => $places, 'guestlist_quota.integer' => $places, 'guestlist_quota.min' => $places, 'guestlist_quota.max' => $places,
            'guestlist_cutoff.required' => 'Set the free entry time.',
            'close_time.required' => 'Set the closing time.',
            'min_spend.*.required' => $amount, 'min_spend.*.integer' => $amount, 'min_spend.*.min' => $amount,
            'lineup.required' => 'Mark at least one performer as Headliner.',
            'lineup.*.performer.required' => "Add the performer's name, or remove this row.",
            'lineup.*.starts_at.required' => $when, 'lineup.*.starts_at.date_format' => $when,
            'lineup.*.ends_at.required' => $when, 'lineup.*.ends_at.date_format' => $when,
            'lineup.*.ends_at.different' => "The set can't start and end at the same time.",
        ];
    }

    /** Validated form mapped to events columns. */
    public function columns(): array
    {
        $v = $this->validated();

        return [
            'name' => $v['name'], 'genre' => $v['genre'] ?? null, 'blurb' => $v['blurb'] ?? null,
            'guestlist_quota' => $v['guestlist_quota'], 'guestlist_cutoff' => $v['guestlist_cutoff'], 'close_time' => $v['close_time'],
            'min_spend_stage' => $v['min_spend']['stage'], 'min_spend_booth' => $v['min_spend']['booth'], 'min_spend_bar' => $v['min_spend']['bar'],
        ];
    }
}
