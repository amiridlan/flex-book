import { z } from 'zod';

import { isoDateTimeSchema } from './common';

export const slotSchema = z.object({
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  available: z.boolean(),
  /** Seats left, for shared spaces like hot desks. */
  remaining: z.number().int().min(0).nullable(),
});
export type Slot = z.infer<typeof slotSchema>;

export const availabilitySchema = z.object({
  spaceId: z.string(),
  /** The requested day in the location's timezone, `yyyy-MM-dd`. */
  date: z.iso.date(),
  timezone: z.string(),
  /** False for spaces arranged with the sales team (private offices). */
  bookable: z.boolean(),
  /** False when the location is closed that day. */
  open: z.boolean(),
  slots: z.array(slotSchema).readonly(),
});
export type Availability = z.infer<typeof availabilitySchema>;
