import { zonedInstant } from '@/lib/time';

import { createApiClient } from '../../client/api-client';
import { createAuthRepository } from '../../repositories/auth-repository';
import { createBookingRepository } from '../../repositories/booking-repository';
import { createSpaceRepository } from '../../repositories/space-repository';
import { DEMO_PASSWORD } from '../db/users';
import { createMockServer } from '../mock-server';

// Tuesday 29/09/2026, 10:00 AM in Kuala Lumpur.
const NOW = Date.parse('2026-09-29T02:00:00Z');
const KL = { lat: 3.1528, lng: 101.7038, mocked: false };
const ON_SITE = { lat: 3.1478, lng: 101.7065, mocked: false }; // Menara Aurora
const SYDNEY = { lat: -33.8688, lng: 151.2093, mocked: false };
const SPACE = 'loc_tcg_kul__room-s';

async function setup(nowMs = NOW) {
  let clock = nowMs;
  const server = createMockServer({ latencyMs: 0, failureRate: 0, now: () => clock });
  const sessions: Record<string, string | null> = {};
  let current = '';
  const api = createApiClient({ transport: server, getToken: () => sessions[current] ?? null });
  const auth = createAuthRepository(api);
  async function as(email: string) {
    current = email;
    if (!sessions[email]) sessions[email] = (await auth.login(email, DEMO_PASSWORD)).token;
  }
  await as('aisyah@example.com');
  return {
    as,
    bookings: createBookingRepository(api),
    spaces: createSpaceRepository(api),
    setClock: (ms: number) => {
      clock = ms;
    },
  };
}

/** First free hourly slot on a KL date. */
async function freeSlot(spaces: Awaited<ReturnType<typeof setup>>['spaces'], date: string) {
  const day = await spaces.availability(SPACE, date);
  const slot = day.slots.find((s) => s.available);
  if (!slot) throw new Error('no free slot');
  return slot;
}

describe('mock bookings API', () => {
  it('creates a booking with tax and a QR token', async () => {
    const { bookings, spaces } = await setup();
    const slot = await freeSlot(spaces, '2026-09-30');

    const booking = await bookings.create({ spaceId: SPACE, ...pick(slot), device: KL });

    expect(booking.status).toBe('confirmed');
    expect(booking.code).toMatch(/^FXB-[A-Z2-9]{4}$/);
    expect(booking.qrToken).toBeTruthy();
    expect(booking.price).toMatchObject({
      subtotal: { amountMinor: 6_000, currency: 'MYR' },
      tax: { amountMinor: 480 }, // 8% SST
      total: { amountMinor: 6_480 },
      taxLabel: 'SST',
    });
  });

  it('re-checks the distance rule on the server', async () => {
    const { bookings, spaces } = await setup();
    const slot = await freeSlot(spaces, '2026-09-30');

    await expect(
      bookings.create({ spaceId: SPACE, ...pick(slot), device: SYDNEY }),
    ).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: { location: [expect.stringContaining('from within Malaysia')] },
    });
    await expect(
      bookings.create({ spaceId: SPACE, ...pick(slot), device: { ...KL, mocked: true } }),
    ).rejects.toMatchObject({ fieldErrors: { location: [expect.stringContaining('simulated')] } });
    await expect(
      bookings.create({ spaceId: SPACE, ...pick(slot), device: null }),
    ).rejects.toMatchObject({
      kind: 'validation',
    });
  });

  it('does not let two people take the same slot', async () => {
    const { as, bookings, spaces } = await setup();
    const slot = await freeSlot(spaces, '2026-09-30');
    await bookings.create({ spaceId: SPACE, ...pick(slot), device: KL });

    const after = await spaces.availability(SPACE, '2026-09-30');
    expect(after.slots.find((s) => s.startsAt === slot.startsAt)?.available).toBe(false);

    await as('sarah.group@example.com'); // group admin cannot book
    await expect(
      bookings.create({ spaceId: SPACE, ...pick(slot), device: KL }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('rejects a slot that is already taken', async () => {
    const { bookings, spaces } = await setup();
    const slot = await freeSlot(spaces, '2026-09-30');
    await bookings.create({ spaceId: SPACE, ...pick(slot), device: KL });

    await expect(
      bookings.create({ spaceId: SPACE, ...pick(slot), device: KL }),
    ).rejects.toMatchObject({
      fieldErrors: { startsAt: [expect.stringContaining('no longer available')] },
    });
  });

  it('lists the seeded past booking and new ones', async () => {
    const { bookings, spaces } = await setup();
    const before = await bookings.mine();
    expect(before.some((b) => b.status === 'completed')).toBe(true);

    const slot = await freeSlot(spaces, '2026-09-30');
    await bookings.create({ spaceId: SPACE, ...pick(slot), device: KL });

    expect(await bookings.mine()).toHaveLength(before.length + 1);
  });

  it('enforces the cancellation cut-off', async () => {
    const { bookings, spaces, setClock } = await setup();
    const slot = await freeSlot(spaces, '2026-09-30');
    const booking = await bookings.create({ spaceId: SPACE, ...pick(slot), device: KL });

    setClock(Date.parse(slot.startsAt) - 30 * 60_000);
    await expect(bookings.cancel(booking.id)).rejects.toMatchObject({ kind: 'validation' });

    setClock(Date.parse(slot.startsAt) - 2 * 3_600_000);
    await expect(bookings.cancel(booking.id)).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('checks in only on site and inside the window', async () => {
    const { bookings, spaces, setClock } = await setup();
    const slot = await freeSlot(spaces, '2026-09-30');
    const booking = await bookings.create({ spaceId: SPACE, ...pick(slot), device: KL });

    await expect(bookings.checkIn(booking.id, ON_SITE)).rejects.toMatchObject({
      kind: 'validation',
    });

    setClock(Date.parse(slot.startsAt) - 5 * 60_000);
    await expect(bookings.checkIn(booking.id, KL)).rejects.toMatchObject({
      fieldErrors: { location: [expect.stringContaining('You need to be at Menara Aurora')] },
    });
    await expect(bookings.checkIn(booking.id, ON_SITE)).resolves.toMatchObject({
      status: 'checked_in',
    });
  });

  it('hides other users’ bookings', async () => {
    const { as, bookings, spaces } = await setup();
    const slot = await freeSlot(spaces, '2026-09-30');
    const booking = await bookings.create({ spaceId: SPACE, ...pick(slot), device: KL });

    await as('daniel.hive@example.com');
    await expect(bookings.get(booking.id)).rejects.toMatchObject({ kind: 'not_found' });
  });

  it('builds slot instants in local time', () => {
    expect(zonedInstant('2026-09-30', '14:00', 'Asia/Kuala_Lumpur')).toBe(
      '2026-09-30T06:00:00.000Z',
    );
  });
});

function pick(slot: { startsAt: string; endsAt: string }) {
  return { startsAt: slot.startsAt, endsAt: slot.endsAt };
}
