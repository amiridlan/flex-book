import { z } from 'zod';

import { brandIdSchema } from './brand';
import { countryCodeSchema, moneySchema } from './common';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const spaceTypeSchema = z.enum([
  'hot_desk',
  'meeting_room',
  'private_office',
  'event_space',
]);
export type SpaceType = z.infer<typeof spaceTypeSchema>;

export const rateUnitSchema = z.enum(['hour', 'day', 'month']);
export type RateUnit = z.infer<typeof rateUnitSchema>;

export const spaceSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  type: spaceTypeSchema,
  name: z.string(),
  capacity: z.number().int().positive(),
  amenities: z.array(z.string()).readonly(),
  rate: z.object({ unit: rateUnitSchema, price: moneySchema }),
});
export type Space = z.infer<typeof spaceSchema>;

/** Opening hours in the location's local time. Index 0 = Monday. Null = closed. */
export const openingHoursSchema = z
  .array(z.object({ opens: hhmm, closes: hhmm }).nullable())
  .length(7)
  .readonly();

export const locationSchema = z.object({
  id: z.string(),
  brandId: brandIdSchema,
  countryCode: countryCodeSchema,
  city: z.string(),
  name: z.string(),
  address: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** IANA timezone, e.g. `Australia/Sydney`. All local times render in this zone. */
  timezone: z.string(),
  openingHours: openingHoursSchema,
  amenities: z.array(z.string()).readonly(),
  /** Anti-fake-booking rules, owned by the backend so each market can tune them. */
  bookingRules: z.object({
    sameDayRadiusKm: z.number().positive(),
    checkInRadiusM: z.number().positive(),
  }),
});
export type Location = z.infer<typeof locationSchema>;

export const locationDetailSchema = locationSchema.extend({
  spaces: z.array(spaceSchema).readonly(),
});
export type LocationDetail = z.infer<typeof locationDetailSchema>;
