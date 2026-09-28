<?php

namespace App\Support;

use Carbon\CarbonInterface;

final class Iso
{
    /** UTC ISO 8601 with milliseconds, e.g. 2026-10-04T22:00:00.000Z (the app's contract format). */
    public static function utc(?CarbonInterface $time): ?string
    {
        return $time?->copy()->utc()->format('Y-m-d\TH:i:s.v\Z');
    }
}
