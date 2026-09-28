<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\RateUnit;
use App\Models\Booking;
use App\Models\Space;
use App\Support\Iso;
use Carbon\CarbonImmutable;

/**
 * Builds a day's slots from opening hours in the location's own timezone and
 * the bookings that hold the space. Instants go out in UTC; DST is handled by
 * Carbon + the IANA zone, never by fixed offsets.
 */
final class AvailabilityService
{
    /**
     * @return array{spaceId: string, date: string, timezone: string, bookable: bool, open: bool,
     *               slots: list<array{startsAt: string, endsAt: string, available: bool, remaining: int|null}>}
     */
    public function forDate(Space $space, string $date, CarbonImmutable $now): array
    {
        $location = $space->location;
        $tz = $location->timezone;
        $weekday = CarbonImmutable::parse($date, $tz)->dayOfWeekIso - 1; // Monday = 0
        $hours = $location->openingHours->firstWhere('weekday', $weekday);

        $base = ['spaceId' => $space->id, 'date' => $date, 'timezone' => $tz];

        if (! $space->is_bookable_online) {
            return [...$base, 'bookable' => false, 'open' => $hours !== null, 'slots' => []];
        }
        if ($hours === null) {
            return [...$base, 'bookable' => true, 'open' => false, 'slots' => []];
        }

        $opens = CarbonImmutable::parse("{$date} {$hours->opens}", $tz)->utc();
        $closes = CarbonImmutable::parse("{$date} {$hours->closes}", $tz)->utc();
        $held = Booking::query()->overlapping($space->id, $opens, $closes)->get(['starts_at', 'ends_at', 'status']);

        if ($space->rate_unit === RateUnit::Day) {
            $remaining = max(0, $space->seats - $held->count());

            return [...$base, 'bookable' => true, 'open' => true, 'slots' => [[
                'startsAt' => Iso::utc($opens),
                'endsAt' => Iso::utc($closes),
                'available' => $remaining > 0 && $closes > $now,
                'remaining' => $remaining,
            ]]];
        }

        $slots = [];
        for ($start = $opens; $start->addHour() <= $closes; $start = $start->addHour()) {
            $end = $start->addHour();
            $taken = $held->contains(fn (Booking $b) => $b->starts_at < $end && $b->ends_at > $start
                && $b->effectiveStatus($now) !== BookingStatus::NoShow);
            $slots[] = [
                'startsAt' => Iso::utc($start),
                'endsAt' => Iso::utc($end),
                'available' => $start > $now && ! $taken,
                'remaining' => null,
            ];
        }

        return [...$base, 'bookable' => true, 'open' => true, 'slots' => $slots];
    }
}
