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

    /** From EVENTS in docs/mockup/fanglle-pengelola-mockup.jsx, Thursday first. */
    private function events(): array
    {
        return [
            [
                ['name' => 'Descent', 'genre' => 'Melodic techno', 'blurb' => 'Long, slow builds and a room that gets darker as it gets louder.',
                    'guestlist_quota' => 200, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
                    'min_spend_stage' => 10000000, 'min_spend_booth' => 15000000, 'min_spend_bar' => 5000000],
                [['Rafi Hartono', R::WarmUp, '22:00', '00:00'], ['Ilse Varga', R::Headliner, '00:00', '03:00'], ['Rafi Hartono', R::Closing, '03:00', '04:00']],
            ],
            [
                ['name' => 'Second Wave', 'genre' => 'Afro house', 'blurb' => 'Percussion from the first record to the last.',
                    'guestlist_quota' => 200, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
                    'min_spend_stage' => 16000000, 'min_spend_booth' => 24000000, 'min_spend_bar' => 8000000],
                [['Kirana', R::WarmUp, '22:00', '23:30'], ['Bayu Kencana', R::GuestStar, '23:30', '00:30'], ['Marcel Oduya', R::Headliner, '00:30', '02:30'],
                    ['Lintang', R::GuestStar, '02:30', '03:30'], ['Kirana', R::Closing, '03:30', '04:00']],
            ],
            [
                ['name' => 'Fall Line', 'genre' => 'Tech house', 'blurb' => 'The busiest night of the week.',
                    'guestlist_quota' => 250, 'guestlist_cutoff' => '23:00', 'close_time' => '04:00',
                    'min_spend_stage' => 20000000, 'min_spend_booth' => 30000000, 'min_spend_bar' => 10000000],
                [['Dewa Anom', R::WarmUp, '22:00', '00:00'], ['Nadia Sorrel', R::Headliner, '00:00', '03:00'], ['Dewa Anom', R::Closing, '03:00', '04:00']],
            ],
            [
                ['name' => 'Afterglow', 'genre' => 'Deep house', 'blurb' => 'A slower Sunday, with more room to talk at the bar.',
                    'guestlist_quota' => 200, 'guestlist_cutoff' => '23:30', 'close_time' => '03:00',
                    'min_spend_stage' => 8000000, 'min_spend_booth' => 12000000, 'min_spend_bar' => 4000000],
                [['Saka', R::WarmUp, '22:00', '00:00'], ['Theo Brandt', R::Headliner, '00:00', '03:00'], ['Saka', R::Closing, '03:00', '04:00']],
            ],
        ];
    }
}
