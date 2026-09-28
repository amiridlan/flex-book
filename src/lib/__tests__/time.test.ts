import {
  formatInZone,
  nextLocalDates,
  offsetLabel,
  todayIn,
  weekdayIndex,
  zonedInstant,
} from '../time';

describe('time helpers', () => {
  it('applies Sydney daylight saving (starts 04/10/2026)', () => {
    expect(zonedInstant('2026-10-03', '09:00', 'Australia/Sydney')).toBe(
      '2026-10-02T23:00:00.000Z',
    );
    expect(zonedInstant('2026-10-05', '09:00', 'Australia/Sydney')).toBe(
      '2026-10-04T22:00:00.000Z',
    );
    expect(offsetLabel('Australia/Sydney', '2026-10-03T00:00:00Z')).toBe('GMT+10');
    expect(offsetLabel('Australia/Sydney', '2026-10-05T00:00:00Z')).toBe('GMT+11');
  });

  it('leaves Brisbane on UTC+10 all year', () => {
    expect(offsetLabel('Australia/Brisbane', '2026-12-01T00:00:00Z')).toBe('GMT+10');
  });

  it('formats an instant in the location zone, not the device zone', () => {
    const instant = '2026-10-04T22:00:00.000Z';
    expect(formatInZone(instant, 'Australia/Sydney', 'dd/MM/yyyy h:mm a')).toBe(
      '05/10/2026 9:00 AM',
    );
    expect(formatInZone(instant, 'Asia/Kuala_Lumpur', 'dd/MM/yyyy h:mm a')).toBe(
      '05/10/2026 6:00 AM',
    );
  });

  it('computes "today" in the location zone', () => {
    // 16:30 UTC on 28/09 is 02:30 on 29/09 in Sydney but 23:30 on 28/09 in Bangkok.
    const now = Date.parse('2026-09-28T16:30:00Z');
    expect(todayIn('Australia/Sydney', now)).toBe('2026-09-29');
    expect(todayIn('Asia/Bangkok', now)).toBe('2026-09-28');
  });

  it('lists consecutive local dates across a month boundary', () => {
    const now = Date.parse('2026-09-29T02:00:00Z');
    expect(nextLocalDates('Asia/Kuala_Lumpur', 3, now)).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ]);
  });

  it('maps dates to Monday-first weekday indexes', () => {
    expect(weekdayIndex('2026-09-28')).toBe(0); // Monday
    expect(weekdayIndex('2026-10-04')).toBe(6); // Sunday
  });
});
