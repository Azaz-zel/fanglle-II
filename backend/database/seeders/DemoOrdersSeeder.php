<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\CheckInMethod;
use App\Enums\PassKind;
use App\Enums\QrMode;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\GuestlistSignup;
use App\Models\Pass;
use App\Models\TableBooking;
use App\Models\User;
use App\Models\VenueTable;
use App\Support\EntryCode;
use App\Support\Night;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Sample guests for this week's demo nights, so the manager panel has something to show: tables, guestlist and door
 * check-ins. Opt-in (db:seed --class, or fanglle:demo-reset --orders), never part of the plain seed the tests and the
 * concurrency scripts start from. A night that already has a booking or a signup is left alone, so running it twice adds nothing.
 */
class DemoOrdersSeeder extends Seeder
{
    private const NAMES = [
        'Made Wirawan', 'Ayu Pratiwi', 'Kadek Surya', 'Putu Lestari', 'Nadia Hartono', 'Rizky Pratama', 'Sarah Lim', 'Dimas Saputra',
        'Chloe Martin', 'Luca Rossi', 'Komang Adi', 'Intan Permata', 'Jake Thompson', 'Mei Tanaka', 'Bagus Wicaksono', 'Clara Wijaya',
        'Oscar Lindqvist', 'Gede Arimbawa', 'Tiara Anggraini', 'Ethan Brooks', 'Wayan Sudira', 'Amelia Santoso', 'Hugo Laurent', 'Dewi Kusuma',
        'Farhan Akbar', 'Sofia Reyes', 'Nyoman Ardana', 'Bella Gunawan', 'Ryan Walker', 'Laras Ayuningtyas', 'Kevin Halim', 'Ines Moreau',
    ];

    // Tables taken per night, Thursday first: [table, party, status]. Saturday is the busiest night.
    private const TABLES = [
        [['B1', 10, 'paid'], ['B4', 8, 'paid'], ['S2', 5, 'paid'], ['S3', 6, 'paid'], ['T2', 3, 'no_show'], ['T5', 4, 'released']],
        [['B1', 12, 'paid'], ['B2', 9, 'paid'], ['B5', 11, 'paid'], ['S1', 6, 'paid'], ['S4', 4, 'paid'], ['T1', 4, 'paid'], ['T3', 2, 'no_show'], ['B6', 7, 'released']],
        [['B1', 12, 'paid'], ['B2', 10, 'paid'], ['B4', 12, 'paid'], ['B5', 8, 'paid'], ['S1', 6, 'paid'], ['S2', 5, 'paid'], ['S3', 6, 'paid'], ['T1', 4, 'paid'], ['T4', 3, 'paid'], ['T6', 4, 'held'], ['B3', 8, 'released']],
        [['B2', 8, 'paid'], ['S2', 6, 'paid'], ['S4', 4, 'paid'], ['T3', 3, 'paid'], ['T6', 2, 'held']],
    ];

    // Guestlist signups per night: [party, qr mode, removed].
    private const SIGNUPS = [
        [[4, 'group', false], [2, 'personal', false], [6, 'group', false], [3, 'group', false], [1, 'group', false], [5, 'personal', false], [2, 'group', true], [4, 'group', false]],
        [[6, 'group', false], [4, 'personal', false], [2, 'group', false], [8, 'group', false], [3, 'personal', false], [5, 'group', false], [2, 'group', false], [4, 'group', true], [6, 'group', false], [1, 'group', false]],
        [[8, 'group', false], [6, 'group', false], [4, 'personal', false], [5, 'group', false], [3, 'group', false], [6, 'personal', false], [2, 'group', false], [7, 'group', false], [4, 'group', true], [5, 'group', false], [3, 'group', false], [2, 'personal', false]],
        [[3, 'group', false], [2, 'personal', false], [4, 'group', false], [2, 'group', false], [5, 'group', false], [3, 'group', true]],
    ];

    public function run(): void
    {
        $thursday = DemoWeekSeeder::thursday();
        $tables = VenueTable::pluck('id', 'code');
        $door = User::whereIn('email', ['door.a@thefanglle.example', 'door.b@thefanglle.example'])->get();
        $door = $door->isEmpty() ? User::limit(1)->get() : $door;

        foreach (range(0, 3) as $day) {
            $event = Event::firstWhere('date', $thursday->copy()->addDays($day)->toDateString());
            if (! $event || TableBooking::where('event_id', $event->id)->exists() || GuestlistSignup::where('event_id', $event->id)->exists() || $door->isEmpty()) {
                continue;
            }
            DB::transaction(fn () => $this->night($event, $day, $tables, $door));
        }
    }

    private function night(Event $event, int $day, $tables, $door): void
    {
        $date = $event->date->toDateString();
        $opens = Night::at($date, '22:00');
        $over = now()->gte(Night::at($date, $event->close_time));
        $names = array_merge(array_slice(self::NAMES, $day * 7), array_slice(self::NAMES, 0, $day * 7));
        $n = 0;
        $doorPasses = [];

        foreach (self::TABLES[$day] as [$code, $party, $status]) {
            $status = BookingStatus::from($status === 'held' && $over ? 'released' : ($status === 'no_show' && ! $over ? 'paid' : $status));
            $name = $names[$n++ % count($names)];
            $minSpend = $event->minSpend()[$this->zone($code)];
            $booked = $opens->copy()->subDays(3 - $n % 3)->subMinutes(37 * $n);
            $booking = TableBooking::create([
                'code' => $this->bookingCode(), 'event_id' => $event->id, 'venue_table_id' => $tables[$code], 'status' => $status,
                'name' => $name, 'phone' => $this->phone($day, $n), 'email' => $this->email($name), 'party_size' => $party,
                'min_spend' => $minSpend, 'deposit' => intdiv($minSpend, 2),
                'held_until' => $status === BookingStatus::Held ? now()->addMinutes(12) : $booked->copy()->addMinutes(15),
                'paid_at' => in_array($status, [BookingStatus::Paid, BookingStatus::NoShow], true) ? $booked->copy()->addMinutes(4) : null,
                'created_at' => $status === BookingStatus::Held ? now()->subMinutes(3) : $booked, 'updated_at' => $booked,
            ]);
            if (in_array($status, [BookingStatus::Paid, BookingStatus::NoShow], true)) {
                $pass = $booking->pass()->create([
                    'event_id' => $event->id, 'kind' => PassKind::Table, 'holder_name' => $name, 'people' => $party,
                    'revoked_at' => $status === BookingStatus::NoShow ? Night::at($date, $event->close_time) : null,
                ]);
                if ($status === BookingStatus::Paid) {
                    $doorPasses[] = [$pass, Night::at($date, $event->close_time)];
                }
            }
        }

        foreach (self::SIGNUPS[$day] as $i => [$party, $mode, $removed]) {
            $name = $names[$n++ % count($names)];
            $signup = GuestlistSignup::create([
                'event_id' => $event->id, 'name' => $name, 'phone' => $this->phone($day, $n), 'email' => $this->email($name),
                'party_size' => $party, 'qr_mode' => QrMode::from($mode), 'removed_at' => $removed ? $opens->copy()->subHours(5) : null,
                'created_at' => $opens->copy()->subDays(2)->addMinutes(53 * $i), 'updated_at' => $opens->copy()->subDays(2)->addMinutes(53 * $i),
            ]);
            if ($removed) {
                continue;
            }
            $holders = $mode === 'personal'
                ? array_map(fn ($k) => [$k ? Str::before($names[($n + $k) % count($names)], ' ').' '.Str::afterLast($name, ' ') : $name, 1], range(0, $party - 1))
                : [[$name, $party]];
            foreach ($holders as [$holder, $people]) {
                $pass = $signup->passes()->create(['event_id' => $event->id, 'kind' => PassKind::from($mode), 'holder_name' => $holder, 'people' => $people]);
                $doorPasses[] = [$pass, Night::at($date, $event->guestlist_cutoff)];
            }
        }

        $this->checkIns($doorPasses, $opens, $over, $door);
    }

    /** Only a night that has opened has people inside: on a finished night most came, tonight about half so far. */
    private function checkIns(array $passes, Carbon $opens, bool $over, $door): void
    {
        $last = now();
        if ($last->lte($opens)) {
            return;
        }

        foreach ($passes as $i => [$pass, $until]) {
            if ($over ? $i % 6 === 5 : $i % 2 === 1) {
                continue; // a few never turn up, and tonight half are still to come
            }
            $end = $until->lt($last) ? $until : $last;
            $count = $over || $pass->people === 1 ? $pass->people : intdiv($pass->people + 1, 2);
            if ($i % 4 === 1 && $pass->people > 2) {
                $count--; // someone from the group is still on the way
            }
            $at = $opens->copy()->addSeconds(intdiv($end->diffInSeconds($opens, true) * (($i * 37) % 100), 100));
            $pass->increment('inside_count', $count);
            CheckIn::create([
                'client_uuid' => (string) Str::uuid(), 'pass_id' => $pass->id, 'user_id' => $door[$i % $door->count()]->id, 'count' => $count,
                'method' => [CheckInMethod::Scan, CheckInMethod::Scan, CheckInMethod::Scan, CheckInMethod::Code, CheckInMethod::Search][$i % 5],
                'scanned_at' => $at,
            ]);
        }
    }

    private function zone(string $code): string
    {
        return ['S' => 'stage', 'B' => 'booth', 'T' => 'bar'][$code[0]];
    }

    private function bookingCode(): string
    {
        do {
            $code = 'F2-'.EntryCode::generate(4);
        } while (TableBooking::where('code', $code)->exists());

        return $code;
    }

    private function phone(int $day, int $n): string
    {
        return sprintf('+62812%04d%04d', 3170 + $day * 11, 1000 + $n * 137);
    }

    private function email(string $name): string
    {
        return Str::slug($name, '.').'@example.com';
    }
}
