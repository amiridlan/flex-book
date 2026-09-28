import { formatMoney, taxMinor } from '../money';

describe('formatMoney', () => {
  it.each([
    [{ amountMinor: 350_000, currency: 'MYR' as const }, 'RM 3,500.00'],
    [{ amountMinor: 3_500, currency: 'SGD' as const }, 'S$ 35.00'],
    [{ amountMinor: 22_000, currency: 'HKD' as const }, 'HK$ 220.00'],
    [{ amountMinor: 45_000, currency: 'THB' as const }, '฿ 450.00'],
    [{ amountMinor: 4_950, currency: 'AUD' as const }, 'A$ 49.50'],
    [{ amountMinor: 275_000, currency: 'VND' as const }, '275,000 ₫'],
  ])('formats %o as %s', (money, expected) => {
    expect(formatMoney(money)).toBe(expected);
  });
});

describe('taxMinor', () => {
  it('applies basis points and rounds to the minor unit', () => {
    expect(taxMinor(5_000, 800)).toBe(400); // RM 50.00 at 8% SST
    expect(taxMinor(4_950, 1_000)).toBe(495); // A$ 49.50 at 10% GST
    expect(taxMinor(333, 900)).toBe(30); // 29.97 rounds to 30
  });
});
