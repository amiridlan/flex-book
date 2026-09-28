import { DEMO_ACCOUNTS, DEMO_PASSWORD as UI_DEMO_PASSWORD } from '@/features/auth/demo-accounts';

import { brandSchema } from '../../schemas/brand';
import { countrySchema } from '../../schemas/country';
import { locationSchema, spaceSchema } from '../../schemas/location';
import { userSchema } from '../../schemas/user';
import { BRANDS } from '../db/brands';
import { COUNTRIES } from '../db/countries';
import { LOCATIONS } from '../db/locations';
import { SPACES } from '../db/spaces';
import { DEMO_PASSWORD, USERS } from '../db/users';

describe('seed data', () => {
  it('matches the API contract', () => {
    BRANDS.forEach((b) => brandSchema.parse(b));
    COUNTRIES.forEach((c) => countrySchema.parse(c));
    LOCATIONS.forEach((l) => locationSchema.parse(l));
    SPACES.forEach((s) => spaceSchema.parse(s));
    USERS.forEach((u) => userSchema.parse(u));
  });

  it('has one location per brand in every country (3 x 6 = 18)', () => {
    const pairs = new Set(LOCATIONS.map((l) => `${l.brandId}:${l.countryCode}`));
    expect(LOCATIONS).toHaveLength(18);
    expect(pairs.size).toBe(18);
  });

  it('uses valid IANA timezones', () => {
    for (const location of LOCATIONS) {
      expect(() => new Intl.DateTimeFormat('en', { timeZone: location.timezone })).not.toThrow();
    }
  });

  it('prices every space in its country currency', () => {
    for (const space of SPACES) {
      const location = LOCATIONS.find((l) => l.id === space.locationId);
      const country = COUNTRIES.find((c) => c.code === location?.countryCode);
      expect(space.rate.price.currency).toBe(country?.currency);
      expect(space.rate.price.amountMinor).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    expect(new Set(LOCATIONS.map((l) => l.id)).size).toBe(LOCATIONS.length);
    expect(new Set(SPACES.map((s) => s.id)).size).toBe(SPACES.length);
  });

  it('backs every demo account on the login screen', () => {
    expect(UI_DEMO_PASSWORD).toBe(DEMO_PASSWORD);
    for (const account of DEMO_ACCOUNTS) {
      expect(USERS.some((u) => u.email === account.email)).toBe(true);
    }
  });

  it('points staff assignments at real brands and locations', () => {
    for (const user of USERS) {
      for (const a of user.assignments) {
        expect(BRANDS.some((b) => b.id === a.brandId)).toBe(true);
        if (a.locationId) {
          expect(LOCATIONS.find((l) => l.id === a.locationId)?.brandId).toBe(a.brandId);
        }
      }
    }
  });
});
