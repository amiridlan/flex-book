import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { useSessionStore } from '@/features/auth/session-store';
import { useDemoLocationStore } from '@/features/device-location/demo-location-store';
import { DEMO_PLACES } from '@/features/device-location/demo-places';
import { queryClient } from '@/lib/query-client';
import { nextLocalDates, shortDateLabel } from '@/lib/time';
import { ROUTES } from '@/test-utils/app-routes';

const SLOW = { timeout: 5000 };

describe('route guards', () => {
  beforeEach(() => {
    useSessionStore.getState().signOut();
    useDemoLocationStore.getState().setOverride(null);
    queryClient.clear();
  });

  it('sends signed-out users to login', async () => {
    await renderRouter(ROUTES, { initialUrl: '/' });

    expect(await screen.findByText('Choose a demo account')).toBeTruthy();
  });

  it('opens the documentation before sign-in and comes back', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });

    await fireEvent.press(await screen.findByText('About this demo'));

    expect(await screen.findByText('Tech stack')).toBeTruthy();
    expect(screen.getByText('Hosting and delivery')).toBeTruthy();
    expect(screen.getByText('Expo Router')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Back'));
    expect(await screen.findByText('Choose a demo account')).toBeTruthy();
  });

  it('takes a member to Explore after sign-in', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });

    await fireEvent.press(await screen.findByLabelText('Sign in as Member'));

    expect(await screen.findByText('Hi Aisyah', {}, SLOW)).toBeTruthy();
    expect(await screen.findByText('Menara Aurora', {}, SLOW)).toBeTruthy();
  });

  it('takes staff to their scoped home after sign-in', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });

    await fireEvent.press(await screen.findByLabelText('Sign in as Staff · Hive'));

    // Hive staff land on the first Hive location, with a switcher for the other five.
    expect(await screen.findByText(/Today · Bangsar Loft/, {}, SLOW)).toBeTruthy();
    expect(screen.getByLabelText('Kallang Works · Singapore')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText(/Menara Aurora/)).toBeNull());
  });

  it('lets a member drill into a location and pick a time', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });
    await fireEvent.press(await screen.findByLabelText('Sign in as Member'));

    // Bangsar Loft opens every day, so "tomorrow" always has slots.
    await fireEvent.press(await screen.findByLabelText(/Bangsar Loft/, {}, SLOW));
    expect(await screen.findByText('Local time in Kuala Lumpur', {}, SLOW)).toBeTruthy();

    await fireEvent.press(await screen.findByLabelText(/Meeting room \(4 pax\)/));
    const tomorrow = nextLocalDates('Asia/Kuala_Lumpur', 2)[1] ?? '';
    await fireEvent.press(await screen.findByLabelText(shortDateLabel(tomorrow), {}, SLOW));

    const freeSlots = await screen.findAllByLabelText(/^\d{1,2}:00 (AM|PM)$/, {}, SLOW);
    await fireEvent.press(freeSlots[0]!);

    expect(await screen.findByText('Your selection')).toBeTruthy();
    expect(screen.getByText(/\(Kuala Lumpur time\)/)).toBeTruthy();
  });

  /** Signs in, opens Bangsar Loft (open daily), picks tomorrow's first free meeting-room slot. */
  async function reviewTomorrowAtBangsar() {
    await renderRouter(ROUTES, { initialUrl: '/login' });
    await fireEvent.press(await screen.findByLabelText('Sign in as Member'));
    await fireEvent.press(await screen.findByLabelText(/Bangsar Loft/, {}, SLOW));
    await fireEvent.press(await screen.findByLabelText(/Meeting room \(4 pax\)/, {}, SLOW));
    const tomorrow = nextLocalDates('Asia/Kuala_Lumpur', 2)[1] ?? '';
    await fireEvent.press(await screen.findByLabelText(shortDateLabel(tomorrow), {}, SLOW));
    const freeSlots = await screen.findAllByLabelText(/^\d{1,2}:00 (AM|PM)$/, {}, SLOW);
    await fireEvent.press(freeSlots[0]!);
    await fireEvent.press(await screen.findByLabelText('Continue'));
  }

  function demoPlace(id: string) {
    const place = DEMO_PLACES.find((p) => p.id === id);
    if (!place) throw new Error(`demo place ${id} missing`);
    return place;
  }

  it('books from inside the country and shows a QR code', async () => {
    useDemoLocationStore.getState().setOverride(demoPlace('kl'));
    await reviewTomorrowAtBangsar();

    expect(await screen.findByText('You can book this space', {}, SLOW)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Confirm booking'));

    expect(await screen.findByText('You’re booked in!', {}, SLOW)).toBeTruthy();
    expect(screen.getByLabelText(/Check-in QR code for booking FXB-/)).toBeTruthy();
  });

  it('blocks booking from another country', async () => {
    useDemoLocationStore.getState().setOverride(demoPlace('sydney'));
    await reviewTomorrowAtBangsar();

    expect(await screen.findByText('You can’t book this from here', {}, SLOW)).toBeTruthy();
    expect(screen.getByText(/from within Malaysia/)).toBeTruthy();
    expect(screen.getByLabelText('Confirm booking')).toBeDisabled();
  });

  it('shows walk-in validation errors on the right fields', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });
    await fireEvent.press(await screen.findByLabelText('Sign in as Staff · Hive'));
    await screen.findByText(/Today · Bangsar Loft/, {}, SLOW);

    await fireEvent.press(screen.getByText('Walk-in'));
    await fireEvent.press(await screen.findByLabelText('Book and check in', {}, SLOW));

    expect(await screen.findByText('Choose a space.')).toBeTruthy();
    expect(screen.getByText('Enter the guest’s name.')).toBeTruthy();
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  });

  it('lets staff check in by typing a booking code', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });
    await fireEvent.press(await screen.findByLabelText('Sign in as Staff · Hive'));
    await screen.findByText(/Today · Bangsar Loft/, {}, SLOW);

    await fireEvent.press(screen.getByText('Scan'));
    expect(await screen.findByText('Camera access needed to scan')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Booking code'), 'nope');
    await fireEvent.press(screen.getByLabelText('Check in with code'));
    expect(await screen.findByText('Enter a code like FXB-7QLM.')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Booking code'), 'fxb-zzzz');
    await fireEvent.press(screen.getByLabelText('Check in with code'));
    expect(
      await screen.findByText('No booking with that code at your locations.', {}, SLOW),
    ).toBeTruthy();
  });
});
