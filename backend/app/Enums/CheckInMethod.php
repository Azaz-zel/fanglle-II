<?php

namespace App\Enums;

enum CheckInMethod: string
{
    case Scan = 'scan';
    case Code = 'code';
    case Search = 'search';
    case Override = 'override';
}
