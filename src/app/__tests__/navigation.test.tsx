import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { useSessionStore } from '@/features/auth/session-store';
import { queryClient } from '@/lib/query-client';

import RootLayout from '../_layout';
import MemberTabsLayout from '../(member)/_layout';
import ExploreScreen from '../(member)/index';
import BookingsScreen from '../(member)/bookings';
import MemberProfile from '../(member)/profile';
import LoginScreen from '../login';
import StaffTabsLayout from '../staff/_layout';
import StaffHomeScreen from '../staff/index';
import StaffProfile from '../staff/profile';

const ROUTES = {
  _layout: RootLayout,
  login: LoginScreen,
  '(member)/_layout': MemberTabsLayout,
  '(member)/index': ExploreScreen,
  '(member)/bookings': BookingsScreen,
  '(member)/profile': MemberProfile,
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
});
