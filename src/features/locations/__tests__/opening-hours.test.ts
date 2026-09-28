import { LOCATIONS } from '@/api/mock/db/locations';

import { hoursLabel, openStatus } from '../opening-hours';

const sydney = LOCATIONS.find((l) => l.id === 'loc_tcg_syd');
if (!sydney) throw new Error('seed missing');

describe('openStatus', () => {
  it('uses the location clock, not the device clock', () => {
    // 23:30 UTC Monday 28/09 = 9:30 AM Tuesday in Sydney (open 8 AM – 8 PM).
    expect(openStatus(sydney, Date.parse('2026-09-28T23:30:00Z'))).toEqual({
      open: true,
      closes: '8:00 PM',
    });
  });

  it('is closed after hours and on Sundays', () => {
    // 11:00 UTC Monday = 9:00 PM Monday in Sydney.
    expect(openStatus(sydney, Date.parse('2026-09-28T11:00:00Z'))).toEqual({ open: false });
    // 01:00 UTC Sunday 04/10 = 12:00 PM Sunday in Sydney (closed Sundays).
    expect(openStatus(sydney, Date.parse('2026-10-04T01:00:00Z'))).toEqual({ open: false });
  });

  it('labels hours in 12-hour time', () => {
    expect(hoursLabel({ opens: '08:00', closes: '20:00' })).toBe('8:00 AM – 8:00 PM');
    expect(hoursLabel(null)).toBe('Closed');
  });
});
