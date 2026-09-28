import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { useSessionStore } from '@/features/auth/session-store';
import { queryClient } from '@/lib/query-client';
import { nextLocalDates, shortDateLabel } from '@/lib/time';

import RootLayout from '../_layout';
import MemberStackLayout from '../(member)/_layout';
import MemberTabsLayout from '../(member)/(tabs)/_layout';
import BookingsScreen from '../(member)/(tabs)/bookings';
import ExploreScreen from '../(member)/(tabs)/index';
import MemberProfile from '../(member)/(tabs)/profile';
import LocationDetailScreen from '../(member)/locations/[id]/index';
import SpaceScreen from '../(member)/locations/[id]/spaces/[spaceId]';
import LoginScreen from '../login';
import StaffTabsLayout from '../staff/_layout';
import StaffHomeScreen from '../staff/index';
import StaffProfile from '../staff/profile';

const ROUTES = {
  _layout: RootLayout,
  login: LoginScreen,
  '(member)/_layout': MemberStackLayout,
  '(member)/(tabs)/_layout': MemberTabsLayout,
  '(member)/(tabs)/index': ExploreScreen,
  '(member)/(tabs)/bookings': BookingsScreen,
  '(member)/(tabs)/profile': MemberProfile,
  '(member)/locations/[id]/index': LocationDetailScreen,
  '(member)/locations/[id]/spaces/[spaceId]': SpaceScreen,
  'staff/_layout': StaffTabsLayout,
  'staff/index': StaffHomeScreen,
  'staff/profile': StaffProfile,
};

const SLOW = { timeout: 5000 };

describe('route guards', () => {
  beforeEach(() => {
    useSessionStore.getState().signOut();
    queryClient.clear();
  });

  it('sends signed-out users to login', async () => {
    await renderRouter(ROUTES, { initialUrl: '/' });

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

    expect(await screen.findByText('6 locations in your scope', {}, SLOW)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Menara Aurora')).toBeNull());
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
});
