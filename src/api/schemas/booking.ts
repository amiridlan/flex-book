import { z } from 'zod';

import { brandIdSchema } from './brand';
import { countryCodeSchema, isoDateTimeSchema, moneySchema } from './common';
import { spaceTypeSchema } from './location';

export const bookingStatusSchema = z.enum([
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingSchema = z.object({
  id: z.string(),
  /** Short human-readable reference, e.g. `FXB-7K2Q`. */
  code: z.string(),
  status: bookingStatusSchema,
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
  checkedInAt: isoDateTimeSchema.nullable(),
  /** Opaque token encoded in the check-in QR code. Only sent to the booking owner. */
  qrToken: z.string().nullable(),
  price: z.object({
    subtotal: moneySchema,
    tax: moneySchema,
    total: moneySchema,
    taxLabel: z.string().nullable(),
    taxRateBp: z.number().int().min(0),
  }),
  space: z.object({ id: z.string(), name: z.string(), type: spaceTypeSchema }),
  location: z.object({
    id: z.string(),
    name: z.string(),
    city: z.string(),
    timezone: z.string(),
    brandId: brandIdSchema,
    countryCode: countryCodeSchema,
  }),
});
export type Booking = z.infer<typeof bookingSchema>;

export const deviceFixSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  mocked: z.boolean(),
});

export const createBookingSchema = z.object({
  spaceId: z.string().min(1),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  /** Where the phone is. Null when the user has not shared location. */
  device: deviceFixSchema.nullable(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const checkInSchema = z.object({
  method: z.literal('geo'),
  device: deviceFixSchema.nullable(),
});

/** A booking as staff see it: no QR token, and a masked customer email. */
export const staffBookingSchema = bookingSchema.extend({
  customer: z.object({ name: z.string(), emailMasked: z.string() }),
});
export type StaffBooking = z.infer<typeof staffBookingSchema>;

/** Front-desk check-in: a scanned QR (booking id + token) or a typed booking code. */
const checkInByQr = z.object({ bookingId: z.string().min(1), token: z.string().min(1) });
const checkInByCode = z.object({
  code: z.string().regex(/^FXB-[A-Z2-9]{4}$/, 'Enter a code like FXB-7QLM.'),
});
/** What the front desk scanned (QR) or typed (booking code). */
export type CheckInTarget = z.infer<typeof checkInByQr> | z.infer<typeof checkInByCode>;

/**
 * A front-desk check-in also names the desk's location: a guest can only be
 * checked in at the location they booked, where they are standing.
 */
const deskLocation = { locationId: z.string().min(1) };
export const staffCheckInSchema = z.union([
  checkInByQr.extend(deskLocation),
  checkInByCode.extend(deskLocation),
]);
export type StaffCheckInInput = z.infer<typeof staffCheckInSchema>;

export const walkInSchema = z.object({
  spaceId: z.string().min(1, 'Choose a space.'),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  guestName: z.string().trim().min(2, 'Enter the guest’s name.').max(80),
  guestEmail: z.email('Enter a valid email address.'),
});
export type WalkInInput = z.infer<typeof walkInSchema>;
