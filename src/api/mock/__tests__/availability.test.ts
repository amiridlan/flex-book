import { formatInZone } from '@/lib/time';

import { buildAvailability } from '../availability';
import { LOCATIONS } from '../db/locations';
import { SPACES } from '../db/spaces';

function fixture(locationId: string, key: string) {
  const location = LOCATIONS.find((l) => l.id === locationId);
  const space = SPACES.find((s) => s.id === `${locationId}__${key}`);
  if (!location || !space) throw new Error('seed missing');
  return { location, space };
}

const LONG_AGO = Date.parse('2026-01-01T00:00:00Z');

describe('buildAvailability', () => {
  it('generates hourly meeting-room slots in local time across the DST change', () => {
    const { location, space } = fixture('loc_tcg_syd', 'room-s');

    const before = buildAvailability(location, space, '2026-10-02', LONG_AGO); // Friday, UTC+10
    const after = buildAvailability(location, space, '2026-10-05', LONG_AGO); // Monday, UTC+11

    for (const day of [before, after]) {
      expect(day.slots).toHaveLength(12); // 8 AM – 8 PM
      expect(formatInZone(day.slots[0]?.startsAt ?? '', 'Australia/Sydney', 'h:mm a')).toBe(
        '8:00 AM',
      );
    }
    expect(before.slots[0]?.startsAt).toBe('2026-10-01T22:00:00.000Z');
    expect(after.slots[0]?.startsAt).toBe('2026-10-04T21:00:00.000Z');
  });

  it('reports closed days', () => {
    const { location, space } = fixture('loc_tcg_syd', 'room-s');

    const sunday = buildAvailability(location, space, '2026-10-04', LONG_AGO);

    expect(sunday.open).toBe(false);
    expect(sunday.slots).toEqual([]);
  });

  it('marks past slots unavailable', () => {
    const { location, space } = fixture('loc_tcg_kul', 'room-s');
    // 12:30 PM in Kuala Lumpur on Tuesday 29/09.
    const now = Date.parse('2026-09-29T04:30:00Z');

    const day = buildAvailability(location, space, '2026-09-29', now);

    const past = day.slots.filter((s) => Date.parse(s.startsAt) <= now);
    expect(past.length).toBeGreaterThan(0);
    expect(past.every((s) => !s.available)).toBe(true);
  });

  it('offers hot desks as one all-day slot with seats left', () => {
    const { location, space } = fixture('loc_hive_han', 'hotdesk');

    const day = buildAvailability(location, space, '2026-10-01', LONG_AGO);

    expect(day.slots).toHaveLength(1);
    expect(day.slots[0]?.remaining).toBeGreaterThanOrEqual(4);
  });

  it('does not offer private offices online', () => {
    const { location, space } = fixture('loc_clustered_bne', 'office');

    expect(buildAvailability(location, space, '2026-10-01', LONG_AGO).bookable).toBe(false);
  });
});
