import { createApiClient } from '../../client/api-client';
import { createAuthRepository } from '../../repositories/auth-repository';
import { createBookingRepository } from '../../repositories/booking-repository';
import { createSpaceRepository } from '../../repositories/space-repository';
import { DEMO_PASSWORD } from '../db/users';
import { createMockServer } from '../mock-server';

/**
 * The live demo: the interview runs 3–4 pm in Kuala Lumpur on Tue 29/09/2026. The
 * app may be opened well before that; the booking happens during the interview.
 */
const at = (time: string) => Date.parse(`2026-09-29T${time}:00+08:00`);
const BANGSAR_MEETING_ROOM = 'loc_hive_kul__room-s';
const KL_CITY_CENTRE = { lat: 3.1478, lng: 101.6953, mocked: false };

async function openAppAt(opened: number) {
  let clock = opened;
  const server = createMockServer({ latencyMs: 0, failureRate: 0, now: () => clock });
  let token: string | null = null;
  const api = createApiClient({ transport: server, getToken: () => token });
  token = (await createAuthRepository(api).login('aisyah@example.com', DEMO_PASSWORD)).token;
  return {
    bookings: createBookingRepository(api),
    spaces: createSpaceRepository(api),
    moveClockTo: (ms: number) => {
      clock = ms;
    },
  };
}

describe('interview demo, 3–4 pm', () => {
  it.each(['13:00', '14:30', '15:00', '15:40'])(
    'app opened at %s: every meeting-room slot from 4 pm is free and bookable',
    async (opened) => {
      const { spaces, bookings, moveClockTo } = await openAppAt(at(opened));
      moveClockTo(at('15:10'));

      const day = await spaces.availability(BANGSAR_MEETING_ROOM, '2026-09-29');
      const afternoon = day.slots.filter((s) => Date.parse(s.startsAt) >= at('16:00'));
      expect(afternoon.length).toBeGreaterThan(0);
      expect(afternoon.every((s) => s.available)).toBe(true);

      const slot = afternoon[0]!;
      await expect(
        bookings.create({
          spaceId: BANGSAR_MEETING_ROOM,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          device: KL_CITY_CENTRE,
        }),
      ).resolves.toMatchObject({ status: 'confirmed' });
    },
  );

  it('My bookings already holds an upcoming, confirmed booking with a QR code', async () => {
    const { bookings } = await openAppAt(at('14:30'));

    const mine = await bookings.mine();
    const upcoming = mine.filter((b) => b.status === 'confirmed');

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]).toMatchObject({
      space: { name: 'Boardroom (10 pax)' },
      location: { name: 'Menara Aurora' },
      startsAt: '2026-09-30T02:00:00.000Z', // Wed 30/09, 10:00 AM in Kuala Lumpur
    });
    expect(upcoming[0]?.qrToken).toBeTruthy();
  });
});
