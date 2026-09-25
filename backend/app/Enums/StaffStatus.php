<?php

namespace App\Enums;

enum StaffStatus: string
{
    case Invited = 'invited';
    case Active = 'active';
    case Disabled = 'disabled';
}
