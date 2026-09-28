import { createApiClient } from '../../client/api-client';
import { createAuthRepository } from '../../repositories/auth-repository';
import { createLocationRepository } from '../../repositories/location-repository';
import { DEMO_PASSWORD } from '../db/users';
import { createMockServer } from '../mock-server';

/** A client wired to a fresh mock server, signed in as `email`. */
async function signedInAs(email: string) {
  let token: string | null = null;
  const api = createApiClient({
    transport: createMockServer({ latencyMs: 0, failureRate: 0 }),
    getToken: () => token,
  });
  const auth = createAuthRepository(api);
  const session = await auth.login(email, DEMO_PASSWORD);
  token = session.token;
  return { user: session.user, auth, locations: createLocationRepository(api) };
}

describe('mock server', () => {
  it('rejects wrong credentials with a Laravel-style 422', async () => {
    const api = createApiClient({
      transport: createMockServer({ latencyMs: 0, failureRate: 0 }),
      getToken: () => null,
    });

    await expect(
      createAuthRepository(api).login('aisyah@example.com', 'wrong'),
    ).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: { email: ['These credentials do not match our records.'] },
    });
  });

  it('requires a token for protected endpoints', async () => {
    const api = createApiClient({
      transport: createMockServer({ latencyMs: 0, failureRate: 0 }),
      getToken: () => null,
    });

    await expect(createLocationRepository(api).list()).rejects.toMatchObject({
      kind: 'unauthorized',
    });
  });

  it('lets members see every location', async () => {
    const { locations } = await signedInAs('aisyah@example.com');

    const page = await locations.list();

    expect(page.meta.total).toBe(18);
  });

  it('scopes brand staff to their brand only', async () => {
    const { locations } = await signedInAs('daniel.hive@example.com');

    const page = await locations.list();

    expect(page.meta.total).toBe(6);
    expect(new Set(page.data.map((l) => l.brandId))).toEqual(new Set(['hive']));
  });

  it('scopes location staff to a single location', async () => {
    const { locations } = await signedInAs('priya.tcg@example.com');

    const page = await locations.list();

    expect(page.data.map((l) => l.id)).toEqual(['loc_tcg_kul']);
  });

  it('hides out-of-scope locations as 404, not 403', async () => {
    const { locations } = await signedInAs('daniel.hive@example.com');

    await expect(locations.get('loc_tcg_kul')).rejects.toMatchObject({ kind: 'not_found' });
  });

  it('filters by country and brand', async () => {
    const { locations } = await signedInAs('aisyah@example.com');

    const page = await locations.list({ country: 'AU', brand: 'hive' });

    expect(page.data.map((l) => l.city)).toEqual(['Melbourne']);
  });

  it('returns location detail with priced spaces in local currency', async () => {
    const { locations } = await signedInAs('aisyah@example.com');

    const detail = await locations.get('loc_hive_han');

    expect(detail.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(detail.spaces).toHaveLength(4);
    expect(detail.spaces.every((s) => s.rate.price.currency === 'VND')).toBe(true);
  });

  it('invalidates the token on logout', async () => {
    const { auth, locations } = await signedInAs('aisyah@example.com');

    await auth.logout();

    await expect(locations.list()).rejects.toMatchObject({ kind: 'unauthorized' });
  });

  it('can simulate server failures for error-state testing', async () => {
    const api = createApiClient({
      transport: createMockServer({ latencyMs: 0, failureRate: 1 }),
      getToken: () => null,
    });

    await expect(
      createAuthRepository(api).login('aisyah@example.com', DEMO_PASSWORD),
    ).rejects.toMatchObject({
      kind: 'server',
      status: 500,
    });
  });
});
