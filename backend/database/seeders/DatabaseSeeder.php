<?php

namespace Database\Seeders;

use App\Enums\StaffRole;
use App\Enums\StaffStatus;
use App\Models\User;
use App\Models\VenueTable;
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

        $this->call(DemoWeekSeeder::class);

        // Names and emails from STAFF in docs/mockup/fanglle-pengelola-mockup.jsx. Dev password: "password".
        foreach ([['Manager', 'manager@thefanglle.example', StaffRole::Manager], ['Door staff A', 'door.a@thefanglle.example', StaffRole::Door], ['Door staff B', 'door.b@thefanglle.example', StaffRole::Door]] as [$name, $email, $role]) {
            User::create(['name' => $name, 'email' => $email, 'password' => 'password', 'role' => $role, 'status' => StaffStatus::Active]);
        }
    }
}
