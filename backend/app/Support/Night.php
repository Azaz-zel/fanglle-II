<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/** F2: a night runs from 12:00 to 11:59 the next morning. */
final class Night
{
    /** Minutes since midnight, with hours before 12:00 pushed past 24:00 so they sort after the evening. */
    public static function minutes(string $time): int
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        $minutes = $h * 60 + $m;

        return $minutes < 720 ? $minutes + 1440 : $minutes;
    }

    /** The real moment a night-time happens: 00:30 on the 25th's night is 00:30 on the 26th. */
    public static function at(string $date, string $time): Carbon
    {
        return Carbon::parse($date)->startOfDay()->addMinutes(self::minutes($time));
    }

    /** How the pages say a time: 23:00 is "11 pm", 00:30 is "12:30 am". */
    public static function spoken(string $time): string
    {
        $at = Carbon::createFromFormat('H:i', substr($time, 0, 5));

        return $at->format($at->minute ? 'g:i a' : 'g a');
    }

    /** The night happening now. Before noon it is still last night. */
    public static function tonight(): Carbon
    {
        return Carbon::now()->subHours(12)->startOfDay();
    }
}
