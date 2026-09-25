<?php

namespace App\Support;

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
}
