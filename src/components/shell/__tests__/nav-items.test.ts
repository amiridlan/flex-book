import { MEMBER_NAV, STAFF_NAV } from '../nav-items';

function activeLabel(nav: typeof MEMBER_NAV, path: string) {
  return nav.filter((item) => item.matches(path)).map((item) => item.label);
}

describe('sidebar sections', () => {
  it('keeps location and time pages under Explore', () => {
    expect(activeLabel(MEMBER_NAV, '/')).toEqual(['Explore']);
    expect(activeLabel(MEMBER_NAV, '/locations/loc_hive_kul/spaces/x/review')).toEqual(['Explore']);
    expect(activeLabel(MEMBER_NAV, '/bookings/bk_1')).toEqual(['Bookings']);
  });

  it('marks exactly one staff section', () => {
    expect(activeLabel(STAFF_NAV, '/staff')).toEqual(['Today']);
    expect(activeLabel(STAFF_NAV, '/staff/walk-in')).toEqual(['Walk-in']);
  });
});
