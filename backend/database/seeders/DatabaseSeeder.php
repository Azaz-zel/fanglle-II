<?php

namespace Database\Seeders;

use App\Enums\LineupRole as R;
use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Models\Event;
use App\Models\User;
use App\Models\VenueTable;
use App\Support\Night;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Floor plan from TABLES in docs/mockup/fanglle-pilih-meja-mockup.jsx: code, zone, shape, capacity, x, y.
    private const TABLES = [
        ['S1', 'stage', 'round', 6, 185, 150], ['S2', 'stage', 'round', 6, 185, 285],
        ['S3', 'stage', 'round', 6, 815, 150], ['S4', 'stage', 'round', 6, 815, 285],
        ['B1', 'booth', 'booth', 12, 72, 135], ['B2', 'booth', 'booth', 12, 72, 265], ['B3', 'booth', 'booth', 8, 72, 395],
        ['B4', 'booth', 'booth', 12, 928, 135], ['B5', 'booth', 'booth', 12, 928, 265], ['B6', 'booth', 'booth', 8, 928, 395],
        ['T1', 'bar', 'high', 4, 300, 462], ['T2', 'bar', 'high', 4, 380, 462], ['T3', 'bar', 'high', 4, 460, 462],
        ['T4', 'bar', 'high', 4, 540, 462], ['T5', 'bar', 'high', 4, 620, 462], ['T6', 'bar', 'high', 4, 700, 462],
    ];

    public function run(): void
    {
        foreach (self::TABLES as [$code, $zone, $shape, $capacity, $x, $y]) {
            VenueTable::create(compact('code', 'zone', 'shape', 'capacity', 'x', 'y'));
        }

        // F2: before noon it is still last night, so the week is the one tonight belongs to.
        $thursday = now()->subHours(12)->startOfWeek(Carbon::MONDAY)->addDays(3);

        foreach ($this->events() as $day => [$event, $lineup]) {
            $event = Event::create(['date' => $thursday->copy()->addDays($day)->toDateString()] + $event);
            $event->lineupSlots()->createMany(
                collect($lineup)
                    ->sortBy(fn ($slot) => Night::minutes($slot[2]))
                    ->values()
                    ->map(fn ($slot, $i) => ['performer' => $slot[0], 'role' => $slot[1], 'starts_at' => $slot[2], 'ends_at' => $slot[3], 'position' => $i])
                    ->all(),
            );
        }

        // Names and emails from STAFF in docs/mockup/fanglle-pengelola-mockup.jsx. Dev password: "password".
        foreach ([['Manager', 'manager@thefanglle.example', StaffRole::Manager], ['Door staff A', 'door.a@thefanglle.example', StaffRole::Door], ['Door staff B', 'door.b@thefanglle.example', StaffRole::Door]] as [$name, $email, $role]) {
            User::create(['name' => $name, 'email' => $email, 'password' => 'password', 'role' => $role, 'status' => StaffStatus::Active]);
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
