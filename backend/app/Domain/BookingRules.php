<?php

namespace App\Domain;

use App\Models\Location;
use Carbon\CarbonImmutable;

/**
 * The anti-fake-booking rule. Mirror of src/domain/booking-rules.ts: the app
 * runs it for instant feedback, this runs it again on every booking because a
 * phone's location can be spoofed.
 */
final class BookingRules
{
    /** Returns null when the booking is allowed, otherwise a user-facing reason. */
    public static function violation(Location $location, string $localDate, ?DeviceFix $device, CarbonImmutable $now): ?string
    {
        $sameDay = $localDate === $now->setTimezone($location->timezone)->toDateString();

        if ($device === null) {
            return 'Turn on location to book. We use it to confirm you are near the space, which stops fake bookings.';
        }
        if ($device->mocked) {
            return 'Your phone is reporting a simulated location. Turn off mock location apps to book.';
        }

        $km = Geo::distanceKm($device->lat, $device->lng, (float) $location->lat, (float) $location->lng);

        if ($sameDay) {
            $limit = (float) $location->same_day_radius_km;

            return $km <= $limit
                ? null
                : sprintf('Same-day bookings must be made within %s km of the space. You are %s away.', rtrim(rtrim(number_format($limit, 2), '0'), '.'), Geo::formatDistance($km));
        }

        return Geo::marketAt($device->lat, $device->lng) === $location->country_code
            ? null
            : sprintf('Bookings for a later day must be made from within %s. You are %s away.', $location->country->name, Geo::formatDistance($km));
    }
}
