import {
  buildCheckInPayload,
  normaliseBookingCode,
  parseCheckInPayload,
} from '../check-in-payload';
import { maskEmail } from '../privacy';

describe('check-in payload', () => {
  it('round-trips a booking id and token', () => {
    const text = buildCheckInPayload({ bookingId: 'bk_2_t3vmc2', token: 'qr_KQBDXJKT' });
    expect(text).toBe('flexbook://check-in/bk_2_t3vmc2?token=qr_KQBDXJKT');
    expect(parseCheckInPayload(text)).toEqual({ bookingId: 'bk_2_t3vmc2', token: 'qr_KQBDXJKT' });
  });

  it('ignores QR codes that are not ours', () => {
    expect(parseCheckInPayload('https://example.com')).toBeNull();
    expect(parseCheckInPayload('flexbook://check-in/bk_1')).toBeNull();
  });

  it('normalises typed booking codes', () => {
    expect(normaliseBookingCode(' fxb-7qlm ')).toBe('FXB-7QLM');
    expect(normaliseBookingCode('FXB7QLM')).toBe('FXB-7QLM');
    expect(normaliseBookingCode('FXB-7QL')).toBeNull();
  });
});

describe('maskEmail', () => {
  it('keeps the first letter and domain', () => {
    expect(maskEmail('aisyah@example.com')).toBe('a***@example.com');
    expect(maskEmail('broken')).toBe('***');
  });
});
