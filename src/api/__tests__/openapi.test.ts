import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { buildOpenApiDocument } from '../openapi';

const SPEC_PATH = join(__dirname, '../../../docs/openapi.json');

describe('OpenAPI contract', () => {
  const doc = buildOpenApiDocument();
  const text = `${JSON.stringify(doc, null, 2)}\n`;

  it('is up to date with the Zod schemas (run `npm run openapi` to refresh)', () => {
    if (process.env.UPDATE_OPENAPI === '1') writeFileSync(SPEC_PATH, text);
    expect(readFileSync(SPEC_PATH, 'utf8')).toBe(text);
  });

  it('resolves every $ref', () => {
    const refs = [...text.matchAll(/"\$ref": "#\/components\/schemas\/([A-Za-z]+)"/g)].map(
      (m) => m[1],
    );
    expect(refs.length).toBeGreaterThan(20);
    for (const name of refs) expect(doc.components.schemas).toHaveProperty(name ?? '');
  });

  it('documents the staff scope and server-side distance check', () => {
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        '/bookings',
        '/staff/check-ins',
        '/staff/walk-ins',
        '/spaces/{id}/availability',
      ]),
    );
  });
});
