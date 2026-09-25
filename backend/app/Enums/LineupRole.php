<?php

namespace App\Enums;

enum LineupRole: string
{
    case Headliner = 'headliner';
    case GuestStar = 'guest_star';
    case Support = 'support';
    case WarmUp = 'warm_up';
    case Closing = 'closing';
    case B2b = 'b2b';
}
