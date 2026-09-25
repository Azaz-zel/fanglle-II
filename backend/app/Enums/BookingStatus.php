<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Held = 'held';
    case Paid = 'paid';
    case Released = 'released';
    case NoShow = 'no_show';
}
