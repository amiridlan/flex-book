import type { Location } from '@/api/schemas/location';
import { todayIn } from '@/lib/time';

import { distanceKm, formatDistance, marketAt, type Coordinates } from './geo';

/** A device fix as reported by the phone. `mocked` comes from Android's mock-location flag. */
export type DeviceFix = Coordinates & { readonly mocked: boolean };

export type RuleFailure =
  | { readonly reason: 'no_location' }
  | { readonly reason: 'mocked_location' }
  | { readonly reason: 'too_far'; readonly distanceKm: number; readonly limitKm: number }
  | { readonly reason: 'wrong_country'; readonly distanceKm: number };

export type RuleResult =
  | { readonly ok: true; readonly sameDay: boolean; readonly distanceKm: number }
  | ({ readonly ok: false; readonly sameDay: boolean } & RuleFailure);

/**
 * The anti-fake-booking rule. Same-day bookings need the device within the
 * location's radius (30 km); future bookings need the device in the same
 * country. The backend runs this on every POST /bookings; the app runs the
 * same code first only to explain the result instantly.
 */
export function checkBookingRule(
  location: Location,
  bookingDate: string,
  device: DeviceFix | null,
  now: number = Date.now(),
): RuleResult {
  const sameDay = bookingDate === todayIn(location.timezone, now);
  if (!device) return { ok: false, sameDay, reason: 'no_location' };
  if (device.mocked) return { ok: false, sameDay, reason: 'mocked_location' };

  const km = distanceKm(device, location);
  if (sameDay) {
    const limitKm = location.bookingRules.sameDayRadiusKm;
    return km <= limitKm
      ? { ok: true, sameDay, distanceKm: km }
      : { ok: false, sameDay, reason: 'too_far', distanceKm: km, limitKm };
  }
  return marketAt(device) === location.countryCode
    ? { ok: true, sameDay, distanceKm: km }
    : { ok: false, sameDay, reason: 'wrong_country', distanceKm: km };
}

/** Free cancellation until this many minutes before the start. */
export const CANCELLATION_CUTOFF_MIN = 60;

export function canCancel(startsAt: string, now: number = Date.now()): boolean {
  return Date.parse(startsAt) - now >= CANCELLATION_CUTOFF_MIN * 60_000;
}

/** Check-in opens this many minutes before the start and closes at the end. */
export const CHECK_IN_OPENS_MIN = 15;

export function checkInWindowOpen(startsAt: string, endsAt: string, now: number = Date.now()) {
  return now >= Date.parse(startsAt) - CHECK_IN_OPENS_MIN * 60_000 && now < Date.parse(endsAt);
}

/** Geo check-in needs the device within the location's check-in radius (200 m). */
export function withinCheckInRadius(location: Location, device: DeviceFix): boolean {
  return (
    !device.mocked && distanceKm(device, location) * 1000 <= location.bookingRules.checkInRadiusM
  );
}

/** User-facing explanation of a failed rule. Shared by the API errors and the app's pre-check. */
export function ruleMessage(failure: RuleFailure, countryName: string): string {
  switch (failure.reason) {
    case 'no_location':
      return 'Turn on location to book. We use it to confirm you are near the space, which stops fake bookings.';
    case 'mocked_location':
      return 'Your phone is reporting a simulated location. Turn off mock location apps to book.';
    case 'too_far':
      return `Same-day bookings must be made within ${failure.limitKm} km of the space. You are ${formatDistance(failure.distanceKm)} away.`;
    case 'wrong_country':
      return `Bookings for a later day must be made from within ${countryName}. You are ${formatDistance(failure.distanceKm)} away.`;
  }
}
