<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Confirmed = 'confirmed';
    case CheckedIn = 'checked_in';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';

    /** Statuses that hold a space. */
    public static function holding(): array
    {
        return [self::Confirmed->value, self::CheckedIn->value];
    }
}
