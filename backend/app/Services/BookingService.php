<?php

namespace App\Services;

use App\Domain\BookingRules;
use App\Domain\DeviceFix;
use App\Domain\Geo;
use App\Enums\BookingStatus;
use App\Enums\RateUnit;
use App\Models\Booking;
use App\Models\Space;
use App\Models\User;
use App\Support\Iso;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class BookingService
{
    /** Anti-abuse cap: upcoming bookings a member may hold at once. */
    public const MAX_ACTIVE_BOOKINGS = 5;

    private const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I

    public function __construct(private readonly AvailabilityService $availability) {}

    /**
     * Creates a booking or throws a 422 with Laravel's { message, errors } shape.
     * Order: distance rule, then (inside a row lock) slot availability and the cap.
     */
    public function create(User $user, string $spaceId, CarbonImmutable $startsAt, CarbonImmutable $endsAt, ?DeviceFix $device): Booking
    {
        $space = Space::with('location.country', 'location.openingHours')->find($spaceId);
        if ($space === null || ! $space->is_active) {
            throw ValidationException::withMessages(['spaceId' => 'This space does not exist.']);
        }

        $location = $space->location;
        $now = CarbonImmutable::now();
        $localDate = $startsAt->setTimezone($location->timezone)->toDateString();

        // 1. The phone's location, re-checked here whatever the app decided.
        $violation = BookingRules::violation($location, $localDate, $device, $now);
        if ($violation !== null) {
            throw ValidationException::withMessages(['location' => $violation]);
        }

        return DB::transaction(function () use ($user, $space, $location, $startsAt, $endsAt, $device, $now, $localDate) {
            // 2. Serialise bookings per space: MySQL has no exclusion constraints.
            Space::query()->whereKey($space->id)->lockForUpdate()->first();

            $day = $this->availability->forDate($space, $localDate, $now);
            $slot = collect($day['slots'])->first(fn (array $s) => $s['startsAt'] === Iso::utc($startsAt) && $s['endsAt'] === Iso::utc($endsAt));
            if (! $day['bookable'] || $slot === null || ! $slot['available']) {
                throw ValidationException::withMessages(['startsAt' => 'Sorry, this time is no longer available. Please pick another.']);
            }

            // 3. Cap concurrent bookings.
            $active = Booking::query()
                ->where('user_id', $user->id)
                ->where('status', BookingStatus::Confirmed)
                ->where('ends_at', '>', $now)
                ->count();
            if ($active >= self::MAX_ACTIVE_BOOKINGS) {
                throw ValidationException::withMessages(['startsAt' => 'You can hold up to '.self::MAX_ACTIVE_BOOKINGS.' upcoming bookings at a time.']);
            }

            $hours = $space->rate_unit === RateUnit::Hour ? $startsAt->diffInMinutes($endsAt) / 60 : 1;
            $subtotal = (int) round($space->rate_amount_minor * $hours);
            $rateBp = (int) $location->country->tax_rate_bp;
            $tax = (int) round($subtotal * $rateBp / 10_000);

            return Booking::create([
                'code' => $this->uniqueCode(),
                'space_id' => $space->id,
                'location_id' => $location->id,
                'user_id' => $user->id,
                'status' => BookingStatus::Confirmed,
                'starts_at' => $startsAt->utc(),
                'ends_at' => $endsAt->utc(),
                'subtotal_minor' => $subtotal,
                'tax_minor' => $tax,
                'total_minor' => $subtotal + $tax,
                'currency' => $space->rate_currency,
                'tax_label' => $location->country->tax_label,
                'tax_rate_bp' => $rateBp,
                'booked_lat' => $device?->lat,
                'booked_lng' => $device?->lng,
                'booked_distance_km' => $device ? round(Geo::distanceKm($device->lat, $device->lng, $location->lat, $location->lng), 2) : null,
                'booked_mocked_gps' => $device?->mocked ?? false,
            ]);
        });
    }

    public function cancel(Booking $booking): Booking
    {
        $now = CarbonImmutable::now();
        if ($booking->effectiveStatus($now) !== BookingStatus::Confirmed) {
            throw ValidationException::withMessages(['status' => 'Only upcoming bookings can be cancelled.']);
        }
        if ($now->diffInMinutes($booking->starts_at, false) < Booking::CANCELLATION_CUTOFF_MIN) {
            throw ValidationException::withMessages(['status' => 'Free cancellation ends '.Booking::CANCELLATION_CUTOFF_MIN.' minutes before the start time.']);
        }
        $booking->update(['status' => BookingStatus::Cancelled, 'cancelled_at' => $now]);

        return $booking;
    }

    private function uniqueCode(): string
    {
        do {
            $suffix = '';
            for ($i = 0; $i < 4; $i++) {
                $suffix .= self::CODE_ALPHABET[random_int(0, strlen(self::CODE_ALPHABET) - 1)];
            }
            $code = "FXB-{$suffix}";
        } while (Booking::query()->where('code', $code)->exists());

        return $code;
    }
}
