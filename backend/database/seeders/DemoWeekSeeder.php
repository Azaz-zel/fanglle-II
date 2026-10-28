<?php

namespace Database\Seeders;

use App\Enums\LineupRole as R;
use App\Models\Event;
use App\Support\Night;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/** PRD Backend 2.3: Thursday to Sunday of the current night's week (F2), relative to today. Used by the seeder and fanglle:demo-reset. */
class DemoWeekSeeder extends Seeder
{
    public static function thursday(): Carbon
    {
        return Night::tonight()->startOfWeek(Carbon::MONDAY)->addDays(3);
    }

    public function run(): void
    {
        $thursday = self::thursday();

        foreach ($this->events() as $day => [$event, $lineup]) {
            $date = $thursday->copy()->addDays($day)->toDateString();
            if (Event::where('date', $date)->exists()) {
                continue; // a night the manager has already set up stays as it is
            }
            Event::create(['date' => $date] + $event)->replaceLineup(array_map(
                fn ($slot) => array_combine(['performer', 'role', 'starts_at', 'ends_at'], $slot),
                $lineup,
            ));
        }
    }

    /** Night names, hours and prices from EVENTS in the old manager mockup; the line-ups are the owner's demo names (24 Oct 2026). Thursday first. */
    private function events(): array
    {
        return [
            [
                ['name' => 'Descent', 'genre' => 'R&B', 'blurb' => 'Long, slow builds and a room that gets darker as it gets louder.',
                    'guestlist_quota' => 200, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
                    'min_spend_stage' => 10000000, 'min_spend_booth' => 15000000, 'min_spend_bar' => 5000000],
                [['Don Toliver', R::WarmUp, '22:00', '00:00'], ['The Weeknd', R::Headliner, '00:00', '03:00'], ['Metro Boomin', R::Closing, '03:00', '04:00']],
            ],
            [
                ['name' => 'Second Wave', 'genre' => 'Hip-hop', 'blurb' => 'Hooks from the first record to the last.',
                    'guestlist_quota' => 200, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
                    'min_spend_stage' => 16000000, 'min_spend_booth' => 24000000, 'min_spend_bar' => 8000000],
                [['21 Savage', R::WarmUp, '22:00', '23:30'], ['Future', R::GuestStar, '23:30', '00:30'], ['Drake', R::Headliner, '00:30', '02:30'],
                    ['Lil Baby', R::GuestStar, '02:30', '03:30'], ['PartyNextDoor', R::Closing, '03:30', '04:00']],
            ],
            [
                ['name' => 'Fall Line', 'genre' => 'Rage', 'blurb' => 'The busiest night of the week.',
                    'guestlist_quota' => 250, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
                    'min_spend_stage' => 20000000, 'min_spend_booth' => 30000000, 'min_spend_bar' => 10000000],
                [['Ken Carson', R::WarmUp, '22:00', '00:00'], ['Playboi Carti', R::Headliner, '00:00', '03:00'], ['Destroy Lonely', R::Closing, '03:00', '04:00']],
            ],
            [
                ['name' => 'Afterglow', 'genre' => 'Trap', 'blurb' => 'A slower Sunday, with more room to talk at the bar.',
                    'guestlist_quota' => 200, 'guestlist_cutoff' => '23:30', 'close_time' => '03:00',
                    'min_spend_stage' => 8000000, 'min_spend_booth' => 12000000, 'min_spend_bar' => 4000000],
                [['Lil Uzi Vert', R::WarmUp, '22:00', '00:00'], ['Travis Scott', R::Headliner, '00:00', '03:00'], ['Sheck Wes', R::Closing, '03:00', '04:00']],
            ],
        ];
    }
}
