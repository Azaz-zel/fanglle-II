<?php

namespace App\Enums;

enum PassKind: string
{
    case Group = 'group';
    case Personal = 'personal';
    case Table = 'table';
}
