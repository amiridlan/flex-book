import {
  canCancel,
  checkBookingRule,
  checkInWindowOpen,
  CANCELLATION_CUTOFF_MIN,
  ruleMessage,
  withinCheckInRadius,
} from '@/domain/booking-rules';
import { taxMinor } from '@/lib/money';
import { formatInZone, zonedInstant } from '@/lib/time';

import type { HttpResponse } from '../client/transport';
import type { Booking, BookingStatus, CreateBookingInput } from '../schemas/booking';
import type { Location, Space } from '../schemas/location';
import type { User } from '../schemas/user';
import { buildAvailability } from './availability';
import { COUNTRIES } from './db/countries';
import { LOCATIONS } from './db/locations';
import { SPACES } from './db/spaces';
import { json, validationError } from './router';

type StoredBooking = Booking & { readonly userId: string };

/** Anti-abuse cap: a member can hold this many upcoming bookings at once. */
export const MAX_ACTIVE_BOOKINGS = 5;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I

export function createBookingStore(random: () => number, now: () => number) {
  const bookings = new Map<string, StoredBooking>();
  let sequence = 0;

  function randomCode(length: number): string {
    return Array.from(
      { length },
      () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)],
    ).join('');
  }

  function build(
    user: User,
    location: Location,
    space: Space,
    startsAt: string,
    endsAt: string,
    status: BookingStatus,
  ): StoredBooking {
    const country = COUNTRIES.find((c) => c.code === location.countryCode);
    const hours =
      space.rate.unit === 'hour' ? (Date.parse(endsAt) - Date.parse(startsAt)) / 3_600_000 : 1;
    const subtotal = space.rate.price.amountMinor * hours;
    const rateBp = country?.tax.rateBp ?? 0;
    const tax = taxMinor(subtotal, rateBp);
    const currency = space.rate.price.currency;
    sequence += 1;
    return {
      id: `bk_${sequence}_${randomCode(6).toLowerCase()}`,
      code: `FXB-${randomCode(4)}`,
      status,
      startsAt,
      endsAt,
      createdAt: new Date(now()).toISOString(),
      checkedInAt: null,
      qrToken: `qr_${randomCode(16)}`,
      price: {
        subtotal: { amountMinor: subtotal, currency },
        tax: { amountMinor: tax, currency },
        total: { amountMinor: subtotal + tax, currency },
        taxLabel: country?.tax.label ?? null,
        taxRateBp: rateBp,
      },
      space: { id: space.id, name: space.name, type: space.type },
      location: {
        id: location.id,
        name: location.name,
        city: location.city,
        timezone: location.timezone,
        brandId: location.brandId,
        countryCode: location.countryCode,
      },
      userId: user.id,
    };
  }

  /** Past bookings settle on read, as a scheduled job would on the server. */
  function present({ userId: _userId, ...booking }: StoredBooking): Booking {
    const ended = Date.parse(booking.endsAt) <= now();
    let status = booking.status;
    if (ended && status === 'checked_in') status = 'completed';
    if (ended && status === 'confirmed') status = 'no_show';
    return { ...booking, status };
  }

  function activeFor(userId: string) {
    return [...bookings.values()].filter(
      (b) => b.userId === userId && b.status === 'confirmed' && Date.parse(b.endsAt) > now(),
    );
  }

  function bookedRanges(spaceId: string) {
    return [...bookings.values()].filter(
      (b) => b.space.id === spaceId && (b.status === 'confirmed' || b.status === 'checked_in'),
    );
  }

  return {
    /** Seeds demo history so "Past" is not empty on first launch. */
    seed(user: User) {
      const location = LOCATIONS.find((l) => l.id === 'loc_tcg_kul');
      const space = SPACES.find((s) => s.id === 'loc_tcg_kul__room-s');
      if (!location || !space) return;
      const lastWeek = formatInZone(now() - 7 * 86_400_000, location.timezone, 'yyyy-MM-dd');
      const past = build(
        user,
        location,
        space,
        zonedInstant(lastWeek, '10:00', location.timezone),
        zonedInstant(lastWeek, '11:00', location.timezone),
        'checked_in',
      );
      bookings.set(past.id, { ...past, checkedInAt: past.startsAt });
    },

    ranges: bookedRanges,

    create(user: User, input: CreateBookingInput): HttpResponse {
      const space = SPACES.find((s) => s.id === input.spaceId);
      const location = LOCATIONS.find((l) => l.id === space?.locationId);
      if (!space || !location) return validationError({ spaceId: ['This space does not exist.'] });

      // 1. Anti-fake-booking rule, enforced here regardless of what the app checked.
      const date = formatInZone(input.startsAt, location.timezone, 'yyyy-MM-dd');
      const rule = checkBookingRule(location, date, input.device, now());
      if (!rule.ok) {
        const countryName = COUNTRIES.find((c) => c.code === location.countryCode)?.name ?? '';
        return validationError({ location: [ruleMessage(rule, countryName)] });
      }

      // 2. The slot must still be free (someone may have taken it since the screen loaded).
      const day = buildAvailability(location, space, date, now(), bookedRanges(space.id));
      const slot = day.slots.find(
        (s) => s.startsAt === input.startsAt && s.endsAt === input.endsAt,
      );
      if (!day.bookable || !slot?.available) {
        return validationError({
          startsAt: ['Sorry, this time is no longer available. Please pick another.'],
        });
      }

      // 3. Cap concurrent bookings to limit abuse.
      if (activeFor(user.id).length >= MAX_ACTIVE_BOOKINGS) {
        return validationError({
          startsAt: [`You can hold up to ${MAX_ACTIVE_BOOKINGS} upcoming bookings at a time.`],
        });
      }

      const booking = build(user, location, space, input.startsAt, input.endsAt, 'confirmed');
      bookings.set(booking.id, booking);
      return json(201, { data: present(booking) });
    },

    listFor(user: User): HttpResponse {
      const mine = [...bookings.values()]
        .filter((b) => b.userId === user.id)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map(present);
      return json(200, { data: mine });
    },

    get(user: User, id: string): HttpResponse {
      const booking = bookings.get(id);
      if (!booking || booking.userId !== user.id)
        return json(404, { message: 'Booking not found.' });
      return json(200, { data: present(booking) });
    },

    cancel(user: User, id: string): HttpResponse {
      const booking = bookings.get(id);
      if (!booking || booking.userId !== user.id)
        return json(404, { message: 'Booking not found.' });
      if (present(booking).status !== 'confirmed') {
        return validationError({ status: ['Only upcoming bookings can be cancelled.'] });
      }
      if (!canCancel(booking.startsAt, now())) {
        return validationError({
          status: [
            `Free cancellation ends ${CANCELLATION_CUTOFF_MIN} minutes before the start time.`,
          ],
        });
      }
      const updated: StoredBooking = { ...booking, status: 'cancelled' };
      bookings.set(id, updated);
      return json(200, { data: present(updated) });
    },

    checkIn(
      user: User,
      id: string,
      device: { lat: number; lng: number; mocked: boolean } | null,
    ): HttpResponse {
      const booking = bookings.get(id);
      const location = LOCATIONS.find((l) => l.id === booking?.location.id);
      if (!booking || !location || booking.userId !== user.id) {
        return json(404, { message: 'Booking not found.' });
      }
      if (booking.status !== 'confirmed')
        return validationError({ status: ['This booking cannot be checked in.'] });
      if (!checkInWindowOpen(booking.startsAt, booking.endsAt, now())) {
        return validationError({
          status: ['Check-in opens 15 minutes before your booking starts.'],
        });
      }
      if (!device || !withinCheckInRadius(location, device)) {
        return validationError({
          location: [
            `You need to be at ${location.name} to check in. Or show your QR code at the front desk.`,
          ],
        });
      }
      const updated: StoredBooking = {
        ...booking,
        status: 'checked_in',
        checkedInAt: new Date(now()).toISOString(),
      };
      bookings.set(id, updated);
      return json(200, { data: present(updated) });
    },
  };
}
