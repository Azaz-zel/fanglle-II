<?php

namespace Tests\Unit;

use App\Support\EntryCode;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

class EntryCodeTest extends TestCase
{
    // F17 / T-P4: however the guest reads it out, it is the same code. O is read as 0; I and L as 1.
    #[TestWith(['k70m 4txp'])]
    #[TestWith(['K70M-4TXP'])]
    #[TestWith(['K70M4TXP'])]
    #[TestWith(['K7OM4TXP'])]
    #[TestWith([' k7om - 4txp '])]
    public function test_every_way_of_typing_a_code_normalizes_the_same(string $typed): void
    {
        $this->assertSame('K70M4TXP', EntryCode::normalize($typed));
    }

    public function test_i_and_l_read_as_one(): void
    {
        $this->assertSame('1111ABCD', EntryCode::normalize('iIlL-abcd'));
    }

    public function test_generated_codes_use_crockford_without_i_l_o_u(): void
    {
        foreach (range(1, 200) as $i) {
            $code = EntryCode::generate();
            $this->assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{8}$/', $code);
            $this->assertSame($code, EntryCode::normalize($code));
        }
        $this->assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{4}$/', EntryCode::generate(4));
    }

    public function test_display_format_splits_in_two(): void
    {
        $this->assertSame('K70M-4TXP', EntryCode::format('K70M4TXP'));
    }
}
