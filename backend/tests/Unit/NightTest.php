<?php

namespace Tests\Unit;

use App\Support\Night;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

class NightTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

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

    #[TestWith(['23:00', '2026-09-25 23:00'])]
    #[TestWith(['00:30', '2026-09-26 00:30'])]
    #[TestWith(['11:59', '2026-09-26 11:59'])]
    #[TestWith(['12:00', '2026-09-25 12:00'])]
    public function test_a_time_on_a_night_is_the_next_morning_before_noon(string $time, string $moment): void
    {
        $this->assertSame($moment, Night::at('2026-09-25', $time)->format('Y-m-d H:i'));
    }

    #[TestWith(['2026-09-26 11:59', '2026-09-25'])]
    #[TestWith(['2026-09-26 12:00', '2026-09-26'])]
    #[TestWith(['2026-09-25 23:00', '2026-09-25'])]
    public function test_tonight_is_yesterday_until_noon(string $now, string $tonight): void
    {
        Carbon::setTestNow($now);

        $this->assertSame($tonight, Night::tonight()->toDateString());
    }
}
