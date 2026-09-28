import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { BRANDS } from '../mock/db/brands';
import { COUNTRIES } from '../mock/db/countries';
import { LOCATIONS } from '../mock/db/locations';
import { SPACES } from '../mock/db/spaces';
import { USERS } from '../mock/db/users';

/**
 * The Laravel seeders read the same demo data the mock server uses, exported
 * as JSON, so both backends serve identical brands, locations and prices.
 * `npm run seed:export` rewrites the files; this test fails when they drift.
 */
const DIR = join(__dirname, '../../../backend/database/seeders/data');

const FIXTURES: Readonly<Record<string, unknown>> = {
  'brands.json': BRANDS,
  'countries.json': COUNTRIES,
  'locations.json': LOCATIONS,
  'spaces.json': SPACES,
  // Permissions are derived from the role on the server, so they are not stored.
  'users.json': USERS.map(({ permissions: _permissions, ...user }) => user),
};

describe('Laravel seed fixtures', () => {
  it.each(Object.entries(FIXTURES))('%s matches the mock data', (file, data) => {
    const text = `${JSON.stringify(data, null, 2)}\n`;
    const path = join(DIR, file);
    if (process.env.UPDATE_FIXTURES === '1') writeFileSync(path, text);
    expect(readFileSync(path, 'utf8')).toBe(text);
  });
});
