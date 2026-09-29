import {
  canCancel,
  checkBookingRule,
  checkInWindowOpen,
  CANCELLATION_CUTOFF_MIN,
  CHECK_IN_OPENS_MIN,
  isPastNoShowGrace,
  NO_SHOW_GRACE_MIN,
  ruleMessage,
  withinCheckInRadius,
} from '@/domain/booking-rules';
import { maskEmail } from '@/domain/privacy';
import { taxMinor } from '@/lib/money';
import { formatInZone, todayIn, weekdayIndex, zonedInstant } from '@/lib/time';

import type { HttpResponse } from '../client/transport';
import type {
  Booking,
  BookingStatus,
  CreateBookingInput,
  StaffBooking,
  StaffCheckInInput,
  WalkInInput,
} from '../schemas/booking';
import type { Location, Space } from '../schemas/location';
import type { User } from '../schemas/user';
import { canSeeLocation } from './access';
import { buildAvailability } from './availability';
import { COUNTRIES } from './db/countries';
import { LOCATIONS } from './db/locations';
import { SPACES } from './db/spaces';
import { json, validationError } from './router';

type Customer = { readonly name: string; readonly email: string };

type StoredBooking = Booking & {
  /** Null for walk-ins and demo guests who have no member account. */
  readonly userId: string | null;
  readonly customer: Customer;
};

/** Anti-abuse cap: a member can hold this many upcoming bookings at once. */
export const MAX_ACTIVE_BOOKINGS = 5;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I

/** Fictional guests for the staff board's demo bookings. */
const DEMO_GUESTS: readonly Customer[] = [
  { name: 'Hafiz Aziz', email: 'hafiz@example.com' },
  { name: 'Mei Ling Tan', email: 'meiling@example.com' },
  { name: 'Arjun Pillai', email: 'arjun@example.com' },
  { name: 'Lan Nguyen', email: 'lan@example.com' },
  { name: 'Chloe Martin', email: 'chloe@example.com' },
  { name: 'Kenji Mori', email: 'kenji@example.com' },
  { name: 'Farah Ismail', email: 'farah@example.com' },
  { name: 'Tom Walsh', email: 'tom@example.com' },
];

/**
 * Today's demo bookings per location, relative to the moment the app starts,
 * so the staff board always shows a realistic mix: a finished visit, a no-show
 * whose room was released, a guest arriving now (check-in open) and a later one.
 */
const DEMO_DAY: readonly {
  readonly offsetMin: number;
  readonly spaceKey: string;
  readonly status: BookingStatus;
}[] = [
  { offsetMin: -150, spaceKey: 'room-l', status: 'checked_in' },
  { offsetMin: -45, spaceKey: 'room-s', status: 'confirmed' },
  { offsetMin: 10, spaceKey: 'room-l', status: 'confirmed' },
  // In the boardroom, so the meeting room stays free for a member to book live.
  { offsetMin: 120, spaceKey: 'room-l', status: 'confirmed' },
];

const FIVE_MIN = 5 * 60_000;

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
    owner: { userId: string | null; customer: Customer },
    location: Location,
    space: Space,
    startsAt: string,
    endsAt: string,
    status: BookingStatus,
  ): StoredBooking {
    const country = COUNTRIES.find((c) => c.code === location.countryCode);
    const hours =
      space.rate.unit === 'hour' ? (Date.parse(endsAt) - Date.parse(startsAt)) / 3_600_000 : 1;
    const subtotal = Math.round(space.rate.price.amountMinor * hours);
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
      checkedInAt: status === 'checked_in' ? startsAt : null,
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
      userId: owner.userId,
      customer: owner.customer,
    };
  }

  /**
   * Status as of now, the way a scheduled job settles it on the server: a
   * confirmed booking not checked in within the grace period is a no-show (its
   * space is released), and a checked-in booking that has ended is completed.
   */
  function effectiveStatus(b: StoredBooking): BookingStatus {
    if (b.status === 'confirmed' && isPastNoShowGrace(b.startsAt, now())) return 'no_show';
    if (b.status === 'checked_in' && Date.parse(b.endsAt) <= now()) return 'completed';
    return b.status;
  }

  function present(b: StoredBooking): Booking {
    const { userId: _userId, customer: _customer, ...booking } = b;
    return { ...booking, status: effectiveStatus(b) };
  }

  /** Staff never receive the QR token, and see a masked email (PDPA data minimisation). */
  function presentForStaff(b: StoredBooking): StaffBooking {
    return {
      ...present(b),
      qrToken: null,
      customer: { name: b.customer.name, emailMasked: maskEmail(b.customer.email) },
    };
  }

  function activeFor(userId: string) {
    return [...bookings.values()].filter(
      (b) => b.userId === userId && effectiveStatus(b) === 'confirmed',
    );
  }

  function bookedRanges(spaceId: string) {
    return [...bookings.values()].filter((b) => {
      const status = effectiveStatus(b);
      return b.space.id === spaceId && (status === 'confirmed' || status === 'checked_in');
    });
  }

  function markCheckedIn(b: StoredBooking): StoredBooking {
    const updated: StoredBooking = {
      ...b,
      status: 'checked_in',
      checkedInAt: new Date(now()).toISOString(),
    };
    bookings.set(b.id, updated);
    return updated;
  }

  function seedMemberHistory(member: User) {
    const location = LOCATIONS.find((l) => l.id === 'loc_tcg_kul');
    const space = SPACES.find((s) => s.id === 'loc_tcg_kul__room-s');
    if (!location || !space) return;
    const lastWeek = formatInZone(now() - 7 * 86_400_000, location.timezone, 'yyyy-MM-dd');
    const past = build(
      { userId: member.id, customer: { name: member.name, email: member.email } },
      location,
      space,
      zonedInstant(lastWeek, '10:00', location.timezone),
      zonedInstant(lastWeek, '11:00', location.timezone),
      'checked_in',
    );
    bookings.set(past.id, past);

    // An upcoming booking, so My bookings opens on a confirmed booking with its QR
    // code: 10:00–11:00 in Menara Aurora's boardroom on its next open day.
    const boardroom = SPACES.find((s) => s.id === 'loc_tcg_kul__room-l');
    if (!boardroom) return;
    for (let days = 1; days <= 7; days++) {
      const day = formatInZone(now() + days * 86_400_000, location.timezone, 'yyyy-MM-dd');
      if (!location.openingHours[weekdayIndex(day)]) continue;
      const upcoming = build(
        { userId: member.id, customer: { name: member.name, email: member.email } },
        location,
        boardroom,
        zonedInstant(day, '10:00', location.timezone),
        zonedInstant(day, '11:00', location.timezone),
        'confirmed',
      );
      bookings.set(upcoming.id, upcoming);
      return;
    }
  }

  function seedToday() {
    const base = Math.floor(now() / FIVE_MIN) * FIVE_MIN;
    let guest = 0;
    for (const location of LOCATIONS) {
      const today = todayIn(location.timezone, now());
      const hours = location.openingHours[weekdayIndex(today)];
      if (!hours) continue;
      const opens = Date.parse(zonedInstant(today, hours.opens, location.timezone));
      const closes = Date.parse(zonedInstant(today, hours.closes, location.timezone));
      for (const slot of DEMO_DAY) {
        const start = base + slot.offsetMin * 60_000;
        const end = start + 3_600_000;
        const space = SPACES.find((s) => s.id === `${location.id}__${slot.spaceKey}`);
        if (!space || start < opens || end > closes) continue;
        const customer = DEMO_GUESTS[guest % DEMO_GUESTS.length] ?? DEMO_GUESTS[0];
        guest += 1;
        if (!customer) continue;
        const booking = build(
          { userId: null, customer },
          location,
          space,
          new Date(start).toISOString(),
          new Date(end).toISOString(),
          slot.status,
        );
        bookings.set(booking.id, booking);
      }
    }
  }

  return {
    /** Seeds demo data: the member's past visit and a realistic day at every location. */
    seed(member: User | undefined) {
      if (member) seedMemberHistory(member);
      seedToday();
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

      const booking = build(
        { userId: user.id, customer: { name: user.name, email: user.email } },
        location,
        space,
        input.startsAt,
        input.endsAt,
        'confirmed',
      );
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
      if (!booking || booking.userId !== user.id) {
        return json(404, { message: 'Booking not found.' });
      }
      return json(200, { data: present(booking) });
    },

    cancel(user: User, id: string): HttpResponse {
      const booking = bookings.get(id);
      if (!booking || booking.userId !== user.id) {
        return json(404, { message: 'Booking not found.' });
      }
      if (effectiveStatus(booking) !== 'confirmed') {
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

    /** Member self check-in: inside the window and physically on site. */
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
      if (effectiveStatus(booking) !== 'confirmed') {
        return validationError({ status: ['This booking cannot be checked in.'] });
      }
      if (!checkInWindowOpen(booking.startsAt, now())) {
        return validationError({ status: [windowMessage()] });
      }
      if (!device || !withinCheckInRadius(location, device)) {
        return validationError({
          location: [
            `You need to be at ${location.name} to check in. Or show your QR code at the front desk.`,
          ],
        });
      }
      return json(200, { data: present(markCheckedIn(booking)) });
    },

    /** Staff board: one location's bookings on a local date. 404 outside the staff scope. */
    staffList(user: User, locationId: string, date: string | undefined): HttpResponse {
      const location = LOCATIONS.find((l) => l.id === locationId);
      if (!location || !canSeeLocation(user, location)) {
        return json(404, { message: 'Location not found.' });
      }
      const day = date ?? todayIn(location.timezone, now());
      const list = [...bookings.values()]
        .filter(
          (b) =>
            b.location.id === location.id &&
            formatInZone(b.startsAt, location.timezone, 'yyyy-MM-dd') === day,
        )
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map(presentForStaff);
      return json(200, { data: list });
    },

    /** Front-desk check-in by scanned QR (id + token) or typed booking code. */
    staffCheckIn(user: User, input: StaffCheckInInput): HttpResponse {
      const booking =
        'code' in input
          ? [...bookings.values()].find((b) => b.code === input.code)
          : bookings.get(input.bookingId);
      const location = LOCATIONS.find((l) => l.id === booking?.location.id);
      // Same 404 for "no such booking" and "not your brand", so scope cannot be probed.
      if (!booking || !location || !canSeeLocation(user, location)) {
        return json(404, { message: 'No booking with that code at your locations.' });
      }
      // The guest is at this desk, so the booking must be for this location.
      if (location.id !== input.locationId) {
        return validationError({
          locationId: [
            `This booking is at ${location.name}, ${location.city}. Check the guest in at that location.`,
          ],
        });
      }
      if ('token' in input && input.token !== booking.qrToken) {
        return validationError({
          token: ['This QR code is not valid. Ask the member to refresh it.'],
        });
      }
      const status = effectiveStatus(booking);
      if (status === 'checked_in') {
        return validationError({ status: [`${booking.customer.name} is already checked in.`] });
      }
      if (status !== 'confirmed') {
        return validationError({ status: [`This booking is ${status.replace('_', '-')}.`] });
      }
      if (!checkInWindowOpen(booking.startsAt, now())) {
        return validationError({ status: [windowMessage()] });
      }
      return json(200, { data: presentForStaff(markCheckedIn(booking)) });
    },

    /** Walk-in: staff book a free slot today for a guest on site, checked in immediately. */
    walkIn(user: User, input: WalkInInput): HttpResponse {
      const space = SPACES.find((s) => s.id === input.spaceId);
      const location = LOCATIONS.find((l) => l.id === space?.locationId);
      if (!space || !location || !canSeeLocation(user, location)) {
        return validationError({ spaceId: ['Choose a space at your location.'] });
      }
      const today = todayIn(location.timezone, now());
      if (formatInZone(input.startsAt, location.timezone, 'yyyy-MM-dd') !== today) {
        return validationError({ startsAt: ['Walk-ins can only be booked for today.'] });
      }
      const day = buildAvailability(location, space, today, now(), bookedRanges(space.id));
      const slot = day.slots.find(
        (s) => s.startsAt === input.startsAt && s.endsAt === input.endsAt,
      );
      if (!day.bookable || !slot?.available) {
        return validationError({ startsAt: ['That time is no longer free. Pick another slot.'] });
      }
      const booking = build(
        { userId: null, customer: { name: input.guestName, email: input.guestEmail } },
        location,
        space,
        input.startsAt,
        input.endsAt,
        'checked_in',
      );
      const stored: StoredBooking = { ...booking, checkedInAt: new Date(now()).toISOString() };
      bookings.set(stored.id, stored);
      return json(201, { data: presentForStaff(stored) });
    },
  };
}

function windowMessage(): string {
  return `Check-in is open from ${CHECK_IN_OPENS_MIN} minutes before to ${NO_SHOW_GRACE_MIN} minutes after the start time.`;
}
