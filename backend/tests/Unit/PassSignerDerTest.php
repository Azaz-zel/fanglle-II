<?php

namespace Tests\Unit;

use App\Support\PassSigner;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class PassSignerDerTest extends TestCase
{
    private static function der(string $r, string $s): string
    {
        $int = fn (string $v) => "\x02".chr(strlen($v)).$v;
        $body = $int($r).$int($s);

        return "\x30".chr(strlen($body)).$body;
    }

    public function test_a_high_first_byte_carries_a_00_in_der_that_raw_drops(): void
    {
        $r = "\x80".str_repeat("\x11", 31);   // high bit set: DER prefixes 0x00, 33 bytes
        $s = "\xff".str_repeat("\x22", 31);

        $raw = PassSigner::derToRaw(self::der("\x00".$r, "\x00".$s), 32);

        $this->assertSame(64, strlen($raw));
        $this->assertSame($r.$s, $raw);
    }

    public function test_short_integers_are_padded_on_the_left(): void
    {
        $r = str_repeat("\x33", 30);           // leading zero bytes were dropped by DER
        $s = "\x01";

        $raw = PassSigner::derToRaw(self::der($r, $s), 32);

        $this->assertSame(64, strlen($raw));
        $this->assertSame("\x00\x00".$r.str_repeat("\x00", 31)."\x01", $raw);
    }

    public function test_malformed_der_is_refused(): void
    {
        $this->expectException(InvalidArgumentException::class);
        PassSigner::derToRaw("\x31\x06\x02\x01\x01\x02\x01\x01", 32);
    }

    public function test_an_integer_too_long_for_the_curve_is_refused(): void
    {
        $this->expectException(InvalidArgumentException::class);
        PassSigner::derToRaw(self::der(str_repeat("\x44", 33), "\x01"), 32);
    }
}
