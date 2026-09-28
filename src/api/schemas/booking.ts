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
