import { todayIn } from '@/lib/time';

import { createApiClient } from '../../client/api-client';
import { createAuthRepository } from '../../repositories/auth-repository';
import { createSpaceRepository } from '../../repositories/space-repository';
import { createStaffRepository } from '../../repositories/staff-repository';
import { DEMO_PASSWORD } from '../db/users';
import { createMockServer } from '../mock-server';

// Tuesday 29/09/2026, 10:00 AM in Kuala Lumpur. Bangsar Loft (Hive) is open 7 AM – 10 PM daily.
const NOW = Date.parse('2026-09-29T02:00:00Z');
const HIVE_KL = 'loc_hive_kul';

async function setup() {
  const server = createMockServer({ latencyMs: 0, failureRate: 0, now: () => NOW });
  const tokens: Record<string, string> = {};
  let current = '';
  const api = createApiClient({ transport: server, getToken: () => tokens[current] ?? null });
  const auth = createAuthRepository(api);
  return {
    staff: createStaffRepository(api),
    spaces: createSpaceRepository(api),
    async as(email: string) {
      current = email;
      tokens[email] ??= (await auth.login(email, DEMO_PASSWORD)).token;
    },
  };
}

describe('staff API', () => {
  it('shows a realistic day with masked emails and no QR tokens', async () => {
    const { as, staff } = await setup();
    await as('daniel.hive@example.com');

    const board = await staff.bookings(HIVE_KL);

    expect(board.map((b) => b.status)).toEqual(['completed', 'no_show', 'confirmed', 'confirmed']);
    expect(board.every((b) => b.qrToken === null)).toBe(true);
    expect(board.every((b) => /^[a-z]\*\*\*@example\.com$/.test(b.customer.emailMasked))).toBe(
      true,
    );
  });

  it('checks in an arriving booking by code, but not one that is hours away', async () => {
    const { as, staff } = await setup();
    await as('daniel.hive@example.com');
    const [, , arriving, later] = await staff.bookings(HIVE_KL);

    await expect(staff.checkIn({ code: arriving!.code })).resolves.toMatchObject({
      status: 'checked_in',
    });
    await expect(staff.checkIn({ code: later!.code })).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: { status: [expect.stringContaining('Check-in is open from')] },
    });
  });

  it('rejects a QR token that does not match', async () => {
    const { as, staff } = await setup();
    await as('daniel.hive@example.com');
    const [, , arriving] = await staff.bookings(HIVE_KL);

    await expect(
      staff.checkIn({ bookingId: arriving!.id, token: 'qr_FORGED' }),
    ).rejects.toMatchObject({
      fieldErrors: { token: [expect.stringContaining('not valid')] },
    });
  });

  it('keeps staff inside their brand and location', async () => {
    const { as, staff } = await setup();
    await as('daniel.hive@example.com');
    const [, , arriving] = await staff.bookings(HIVE_KL);

    await as('priya.tcg@example.com');
    await expect(staff.bookings(HIVE_KL)).rejects.toMatchObject({ kind: 'not_found' });
    await expect(staff.checkIn({ code: arriving!.code })).rejects.toMatchObject({
      kind: 'not_found',
    });
  });

  it('refuses staff endpoints to members', async () => {
    const { as, staff } = await setup();
    await as('aisyah@example.com');

    await expect(staff.bookings(HIVE_KL)).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('books a walk-in for today and checks it in', async () => {
    const { as, staff, spaces } = await setup();
    await as('daniel.hive@example.com');
    const today = todayIn('Asia/Kuala_Lumpur', NOW);
    const day = await spaces.availability(`${HIVE_KL}__hotdesk`, today);
    const slot = day.slots[0]!;

    const booking = await staff.walkIn({
      spaceId: `${HIVE_KL}__hotdesk`,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      guestName: 'Nadia Karim',
      guestEmail: 'nadia@example.com',
    });

    expect(booking).toMatchObject({ status: 'checked_in', customer: { name: 'Nadia Karim' } });
    expect(booking.customer.emailMasked).toBe('n***@example.com');
  });

  it('returns Laravel-style field errors for a bad walk-in', async () => {
    const { as, staff } = await setup();
    await as('daniel.hive@example.com');

    await expect(
      staff.walkIn({
        spaceId: `${HIVE_KL}__hotdesk`,
        startsAt: '2026-09-29T02:00:00.000Z',
        endsAt: '2026-09-29T03:00:00.000Z',
        guestName: 'N',
        guestEmail: 'not-an-email',
      }),
    ).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: {
        guestName: [expect.any(String)],
        guestEmail: ['Enter a valid email address.'],
      },
    });
  });
});
