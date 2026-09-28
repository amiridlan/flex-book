import { LOCATIONS } from '@/api/mock/db/locations';

import {
  canCancel,
  checkBookingRule,
  checkInWindowOpen,
  isPastNoShowGrace,
  withinCheckInRadius,
} from '../booking-rules';
import { distanceKm, marketAt } from '../geo';

function location(id: string) {
  const found = LOCATIONS.find((l) => l.id === id);
  if (!found) throw new Error(`seed ${id} missing`);
  return found;
}

const KL_TOWER = { lat: 3.1528, lng: 101.7038, mocked: false }; // central Kuala Lumpur
const SYDNEY_CBD = { lat: -33.8688, lng: 151.2093, mocked: false };
const PENANG = { lat: 5.4141, lng: 100.3288, mocked: false };
// 14:00 on Tuesday 29/09/2026 in Malaysia.
const NOW = Date.parse('2026-09-29T06:00:00Z');

describe('geo', () => {
  it('measures distance', () => {
    expect(distanceKm(KL_TOWER, SYDNEY_CBD)).toBeGreaterThan(6_500);
    expect(distanceKm(KL_TOWER, KL_TOWER)).toBe(0);
  });

  it('resolves our markets, preferring Singapore over Malaysia', () => {
    expect(marketAt(KL_TOWER)).toBe('MY');
    expect(marketAt({ lat: 1.2834, lng: 103.8607 })).toBe('SG');
    expect(marketAt({ lat: 21.0285, lng: 105.8542 })).toBe('VN');
    expect(marketAt(SYDNEY_CBD)).toBe('AU');
    expect(marketAt({ lat: 51.5, lng: -0.12 })).toBeNull();
  });
});

describe('checkBookingRule', () => {
  const kl = location('loc_tcg_kul');
  const sydney = location('loc_tcg_syd');

  it('allows a same-day booking within 30 km', () => {
    expect(checkBookingRule(kl, '2026-09-29', KL_TOWER, NOW)).toMatchObject({
      ok: true,
      sameDay: true,
    });
  });

  it('blocks a same-day booking from another city', () => {
    const result = checkBookingRule(kl, '2026-09-29', PENANG, NOW);
    expect(result).toMatchObject({ ok: false, reason: 'too_far', limitKm: 30 });
  });

  it('allows a future booking from anywhere in the same country', () => {
    expect(checkBookingRule(kl, '2026-10-02', PENANG, NOW)).toMatchObject({
      ok: true,
      sameDay: false,
    });
  });

  it('blocks a future booking from another country', () => {
    expect(checkBookingRule(sydney, '2026-10-02', KL_TOWER, NOW)).toMatchObject({
      ok: false,
      reason: 'wrong_country',
    });
  });

  it('judges "same day" in the location timezone', () => {
    // 06:00 UTC on 29/09 is 4:00 PM the same day in Sydney (UTC+10).
    expect(checkBookingRule(sydney, '2026-09-29', SYDNEY_CBD, NOW)).toMatchObject({
      sameDay: true,
    });
    // 15:00 UTC 29/09 is 01:00 on 30/09 in Sydney.
    const late = Date.parse('2026-09-29T15:00:00Z');
    expect(checkBookingRule(sydney, '2026-09-30', SYDNEY_CBD, late)).toMatchObject({
      sameDay: true,
    });
  });

  it('rejects mocked GPS and missing location', () => {
    expect(checkBookingRule(kl, '2026-09-29', { ...KL_TOWER, mocked: true }, NOW)).toMatchObject({
      ok: false,
      reason: 'mocked_location',
    });
    expect(checkBookingRule(kl, '2026-09-29', null, NOW)).toMatchObject({ reason: 'no_location' });
  });
});

describe('cancellation and check-in', () => {
  const start = '2026-09-29T08:00:00.000Z';

  it('allows free cancellation until 1 hour before', () => {
    expect(canCancel(start, Date.parse('2026-09-29T06:59:00Z'))).toBe(true);
    expect(canCancel(start, Date.parse('2026-09-29T07:01:00Z'))).toBe(false);
  });

  it('opens check-in 15 minutes either side of the start', () => {
    expect(checkInWindowOpen(start, Date.parse('2026-09-29T07:44:00Z'))).toBe(false);
    expect(checkInWindowOpen(start, Date.parse('2026-09-29T07:46:00Z'))).toBe(true);
    expect(checkInWindowOpen(start, Date.parse('2026-09-29T08:15:00Z'))).toBe(true);
    expect(checkInWindowOpen(start, Date.parse('2026-09-29T08:16:00Z'))).toBe(false);
  });

  it('treats a booking as a no-show 15 minutes after the start', () => {
    expect(isPastNoShowGrace(start, Date.parse('2026-09-29T08:15:00Z'))).toBe(false);
    expect(isPastNoShowGrace(start, Date.parse('2026-09-29T08:16:00Z'))).toBe(true);
  });

  it('requires being on site to check in by location', () => {
    const kl = location('loc_tcg_kul');
    expect(withinCheckInRadius(kl, { lat: kl.lat, lng: kl.lng, mocked: false })).toBe(true);
    expect(withinCheckInRadius(kl, KL_TOWER)).toBe(false);
  });
});
