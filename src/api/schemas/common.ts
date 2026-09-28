import { z } from 'zod';

/** ISO 3166-1 alpha-2 codes for the markets the app serves. */
export const countryCodeSchema = z.enum(['MY', 'SG', 'HK', 'VN', 'TH', 'AU']);
export type CountryCode = z.infer<typeof countryCodeSchema>;

export const currencyCodeSchema = z.enum(['MYR', 'SGD', 'HKD', 'VND', 'THB', 'AUD']);
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

/** Money as integer minor units (sen, cents) plus currency. Never floats. */
export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: currencyCodeSchema,
});
export type Money = z.infer<typeof moneySchema>;

/** A UTC instant as ISO 8601 with offset, as Laravel serialises Carbon dates. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

/** `{ data: T }` wrapper used by Laravel API resources. */
export function resourceSchema<T extends z.ZodType>(item: T) {
  return z.object({ data: item });
}

/** Laravel paginated resource collection: `{ data, meta, links }`. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item).readonly(),
    meta: z.object({
      current_page: z.number().int(),
      last_page: z.number().int(),
      per_page: z.number().int(),
      total: z.number().int(),
    }),
    links: z.object({
      first: z.string().nullable(),
      last: z.string().nullable(),
      prev: z.string().nullable(),
      next: z.string().nullable(),
    }),
  });
}

export type Paginated<T> = {
  readonly data: readonly T[];
  readonly meta: { current_page: number; last_page: number; per_page: number; total: number };
};

/** Laravel error body: `{ message }` plus `errors` for 422 validation failures. */
export const errorBodySchema = z.object({
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});
