import type { CurrencyCode, Money } from '@/api/schemas/common';

/** Minor-unit exponent per currency (ISO 4217). VND has no minor unit. */
export const CURRENCY_EXPONENT: Readonly<Record<CurrencyCode, number>> = {
  MYR: 2,
  SGD: 2,
  HKD: 2,
  VND: 0,
  THB: 2,
  AUD: 2,
};

/**
 * Explicit symbols: Intl would print a bare `$` for SGD, HKD and AUD, which is
 * ambiguous in a multi-country app. `suffix` follows local convention for VND.
 */
const SYMBOL: Readonly<
  Record<CurrencyCode, { readonly symbol: string; readonly suffix?: boolean }>
> = {
  MYR: { symbol: 'RM' },
  SGD: { symbol: 'S$' },
  HKD: { symbol: 'HK$' },
  VND: { symbol: '₫', suffix: true },
  THB: { symbol: '฿' },
  AUD: { symbol: 'A$' },
};

const formatters = new Map<number, Intl.NumberFormat>();

function numberFormat(digits: number): Intl.NumberFormat {
  let formatter = formatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(digits, formatter);
  }
  return formatter;
}

/** `{ amountMinor: 350000, currency: 'MYR' }` -> `RM 3,500.00`. */
export function formatMoney({ amountMinor, currency }: Money): string {
  const digits = CURRENCY_EXPONENT[currency];
  const amount = numberFormat(digits).format(amountMinor / 10 ** digits);
  const { symbol, suffix } = SYMBOL[currency];
  return suffix ? `${amount} ${symbol}` : `${symbol} ${amount}`;
}

/** Tax on an amount in minor units, rounded half-up to the nearest minor unit. */
export function taxMinor(amountMinor: number, rateBp: number): number {
  return Math.round((amountMinor * rateBp) / 10_000);
}
