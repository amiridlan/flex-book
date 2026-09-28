import { z } from 'zod';

import { countryCodeSchema, currencyCodeSchema } from './common';

export const countrySchema = z.object({
  code: countryCodeSchema,
  name: z.string(),
  currency: currencyCodeSchema,
  /** Decimal places of the currency's minor unit (VND has none). */
  currencyExponent: z.number().int().min(0).max(3),
  /** Tax label and rate in basis points (800 = 8%). Null label = no consumption tax. */
  tax: z.object({ label: z.string().nullable(), rateBp: z.number().int().min(0) }),
});
export type Country = z.infer<typeof countrySchema>;
