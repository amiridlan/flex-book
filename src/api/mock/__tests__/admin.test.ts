import { createApiClient } from '../../client/api-client';
import { createAdminRepository } from '../../repositories/admin-repository';
import { createAuthRepository } from '../../repositories/auth-repository';
import { createBookingRepository } from '../../repositories/booking-repository';
import { createLocationRepository } from '../../repositories/location-repository';
import { createStaffRepository } from '../../repositories/staff-repository';
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
    bookings: createBookingRepository(api),
    staff: createStaffRepository(api),
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

  it('flags members with blocked attempts and no-shows, worst first', async () => {
    const { as, admin, bookings } = await setup();
    // A member tries to book Bangsar Loft from a fake-GPS app.
    await as('olivia@example.com');
    await expect(
      bookings.create({
        spaceId: 'loc_hive_kul__room-s',
        startsAt: '2030-01-07T02:00:00.000Z',
        endsAt: '2030-01-07T03:00:00.000Z',
        device: { lat: 3.13, lng: 101.67, mocked: true },
      }),
    ).rejects.toMatchObject({ kind: 'validation' });

    await as(SUPER);
    const flagged = await admin.flagged();
    expect(flagged[0]).toMatchObject({
      user: { name: 'Ryan Ong', status: 'suspended' },
      blockedAttempts: 3,
    });
    expect(flagged.find((f) => f.user.name === 'Marcus Lee')).toMatchObject({ noShows: 2 });
    expect(flagged.find((f) => f.user.name === 'Olivia Brown')).toMatchObject({
      blockedAttempts: 1,
      lastEvent: { description: 'Fake GPS · Bangsar Loft' },
    });
  });

  it('shows admins every location on one board, and refuses front-desk staff', async () => {
    const { as, staff } = await setup();
    await as(SUPER);
    const all = await staff.allBookings();
    expect(new Set(all.map((b) => b.location.id)).size).toBeGreaterThan(1);

    await as('minh.clustered@example.com'); // brand admin: only Clustered
    const clustered = await staff.allBookings();
    expect(clustered.every((b) => b.location.brandId === 'clustered')).toBe(true);

    await as(DANIEL);
    await expect(staff.allBookings()).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('overrides a booking with a reason and logs it', async () => {
    const { as, admin, staff } = await setup();
    await as(SUPER);
    const board = await staff.allBookings();
    const target = board.find((b) => b.status === 'confirmed' || b.status === 'no_show');
    expect(target).toBeDefined();

    await expect(
      admin.overrideBooking(target!.id, { action: 'check_in', reason: '' }),
    ).rejects.toMatchObject({ kind: 'validation' });

    const done = await admin.overrideBooking(target!.id, {
      action: 'check_in',
      reason: 'Guest arrived; the desk was offline',
    });
    expect(done.status).toBe('checked_in');
    expect((await admin.auditTrail())[0]).toMatchObject({
      action: 'booking.checked_in',
      target: { type: 'booking' },
      reason: 'Guest arrived; the desk was offline',
    });

    await expect(
      admin.overrideBooking(target!.id, { action: 'cancel', reason: 'Too late now' }),
    ).rejects.toMatchObject({ fieldErrors: { action: [expect.stringContaining('checked-in')] } });

    await as(DANIEL);
    await expect(
      admin.overrideBooking(target!.id, { action: 'cancel', reason: 'Not allowed' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });
});
