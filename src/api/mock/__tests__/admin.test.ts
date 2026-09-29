import { createApiClient } from '../../client/api-client';
import { createAdminRepository } from '../../repositories/admin-repository';
import { createAuthRepository } from '../../repositories/auth-repository';
import { createLocationRepository } from '../../repositories/location-repository';
import { DEMO_PASSWORD } from '../db/users';
import { createMockServer } from '../mock-server';

const SUPER = 'farid.super@example.com';
const DANIEL = 'daniel.hive@example.com'; // Hive staff, every Hive location
const PRIYA = 'priya.tcg@example.com'; // TCG staff, Kuala Lumpur only

async function setup() {
  const server = createMockServer({ latencyMs: 0, failureRate: 0, now: () => Date.now() });
  const tokens: Record<string, string> = {};
  let current = '';
  const api = createApiClient({ transport: server, getToken: () => tokens[current] ?? null });
  const auth = createAuthRepository(api);
  return {
    admin: createAdminRepository(api),
    locations: createLocationRepository(api),
    async as(email: string) {
      current = email;
      tokens[email] ??= (await auth.login(email, DEMO_PASSWORD)).token;
    },
  };
}

const idOf = async (admin: Awaited<ReturnType<typeof setup>>['admin'], email: string) =>
  (await admin.users()).find((u) => u.email === email)!.id;

describe('super admin API', () => {
  it('lists every account, super admins first, and refuses everyone else', async () => {
    const { as, admin } = await setup();
    await as(SUPER);
    const users = await admin.users();
    expect(users[0]?.role).toBe('super_admin');
    expect(users.length).toBeGreaterThanOrEqual(13);
    expect(users.filter((u) => u.status === 'suspended').map((u) => u.name)).toEqual(['Ryan Ong']);

    await as('sarah.group@example.com');
    await expect(admin.users()).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('adds a location to a staff member, effective on their next request', async () => {
    const { as, admin, locations } = await setup();
    await as(PRIYA);
    expect((await locations.list({})).data.map((l) => l.id)).toEqual(['loc_tcg_kul']);

    await as(SUPER);
    await admin.updateAccess(await idOf(admin, PRIYA), {
      role: 'staff',
      assignments: [
        { brandId: 'tcg', locationId: 'loc_tcg_kul' },
        { brandId: 'tcg', locationId: 'loc_tcg_sin' },
      ],
    });

    await as(PRIYA);
    expect((await locations.list({})).data.map((l) => l.id).sort()).toEqual([
      'loc_tcg_kul',
      'loc_tcg_sin',
    ]);
  });

  it('restricts a staff member to one location', async () => {
    const { as, admin, locations } = await setup();
    await as(SUPER);
    await admin.updateAccess(await idOf(admin, DANIEL), {
      role: 'staff',
      assignments: [{ brandId: 'hive', locationId: 'loc_hive_kul' }],
    });

    await as(DANIEL);
    await expect(locations.get('loc_hive_sin')).rejects.toMatchObject({ kind: 'not_found' });
    await expect(locations.get('loc_hive_kul')).resolves.toMatchObject({ name: 'Bangsar Loft' });
  });

  it('refuses unsafe or impossible changes', async () => {
    const { as, admin } = await setup();
    await as(SUPER);
    const self = await idOf(admin, SUPER);
    const priya = await idOf(admin, PRIYA);

    await expect(
      admin.updateAccess(self, { role: 'member', assignments: [] }),
    ).rejects.toMatchObject({
      fieldErrors: { role: [expect.stringContaining('your own access')] },
    });
    await expect(
      admin.updateAccess(priya, { role: 'staff', assignments: [] }),
    ).rejects.toMatchObject({
      fieldErrors: { assignments: [expect.stringContaining('at least one')] },
    });
    await expect(
      admin.updateAccess(priya, {
        role: 'brand_admin',
        assignments: [{ brandId: 'tcg', locationId: 'loc_tcg_kul' }],
      }),
    ).rejects.toMatchObject({
      fieldErrors: { assignments: [expect.stringContaining('whole brands')] },
    });
    await expect(
      admin.updateAccess(priya, {
        role: 'staff',
        assignments: [{ brandId: 'hive', locationId: 'loc_tcg_kul' }],
      }),
    ).rejects.toMatchObject({
      fieldErrors: { assignments: [expect.stringContaining('does not exist')] },
    });
  });

  it('writes a structured audit entry for every change', async () => {
    const { as, admin } = await setup();
    await as(SUPER);
    await admin.updateAccess(await idOf(admin, PRIYA), {
      role: 'brand_admin',
      assignments: [{ brandId: 'tcg', locationId: null }],
    });

    const [entry] = await admin.auditTrail();
    expect(entry).toMatchObject({
      action: 'access.updated',
      actor: { name: 'Farid Hassan' },
      target: { type: 'user', label: 'Priya Nair' },
      changes: [
        { field: 'role', from: 'staff', to: 'brand_admin' },
        {
          field: 'access',
          from: 'The Common Ground · Menara Aurora',
          to: 'The Common Ground · all locations',
        },
      ],
    });
  });

  it('suspends an account: signed out now, refused at sign-in, back after reactivation', async () => {
    const { as, admin, locations } = await setup();
    await as(DANIEL);
    await expect(locations.list({})).resolves.toBeTruthy();

    await as(SUPER);
    const daniel = await idOf(admin, DANIEL);
    await admin.setStatus(daniel, { status: 'suspended', reason: 'Left the company' });

    await as(DANIEL);
    await expect(locations.list({})).rejects.toMatchObject({ kind: 'unauthorized' });

    await as(SUPER);
    await admin.setStatus(daniel, { status: 'active', reason: 'Rehired' });
    const [latest, earlier] = await admin.auditTrail();
    expect(latest).toMatchObject({ action: 'account.reactivated', reason: 'Rehired' });
    expect(earlier).toMatchObject({ action: 'account.suspended', reason: 'Left the company' });
  });

  it('refuses sign-in to the seeded suspended member and needs a reason', async () => {
    const { as, admin } = await setup();
    await expect(as('ryan@example.com')).rejects.toMatchObject({
      fieldErrors: { email: [expect.stringContaining('suspended')] },
    });

    await as(SUPER);
    const self = await idOf(admin, SUPER);
    await expect(
      admin.setStatus(self, { status: 'suspended', reason: 'Testing' }),
    ).rejects.toMatchObject({ fieldErrors: { status: [expect.stringContaining('your own')] } });
    await expect(
      admin.setStatus(await idOf(admin, PRIYA), { status: 'suspended', reason: '' }),
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('invites new staff with their access, once per email', async () => {
    const { as, admin } = await setup();
    await as(SUPER);
    const invited = await admin.invite({
      name: 'Aina Karim',
      email: 'Aina.Karim@example.com',
      role: 'staff',
      assignments: [{ brandId: 'clustered', locationId: 'loc_clustered_pen' }],
    });
    expect(invited).toMatchObject({ email: 'aina.karim@example.com', status: 'active' });
    expect((await admin.users()).some((u) => u.id === invited.id)).toBe(true);
    expect((await admin.auditTrail())[0]).toMatchObject({
      action: 'staff.invited',
      target: { label: 'Aina Karim' },
    });

    await expect(
      admin.invite({
        name: 'Someone Else',
        email: 'aina.karim@example.com',
        role: 'staff',
        assignments: [{ brandId: 'hive', locationId: null }],
      }),
    ).rejects.toMatchObject({ fieldErrors: { email: [expect.stringContaining('already')] } });
  });
});
