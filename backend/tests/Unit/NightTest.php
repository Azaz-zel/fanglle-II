<?php

namespace Tests\Unit;

use App\Support\Night;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

class NightTest extends TestCase
{
    #[TestWith(['12:00', 720])]
    #[TestWith(['15:00', 900])]
    #[TestWith(['23:59', 1439])]
    #[TestWith(['00:00', 1440])]
    #[TestWith(['00:30:00', 1470])]
    #[TestWith(['03:30', 1650])]
    #[TestWith(['11:59', 2159])]
    public function test_hours_before_noon_belong_to_the_night_before(string $time, int $minutes): void
    {
        $this->assertSame($minutes, Night::minutes($time));
    }
}
