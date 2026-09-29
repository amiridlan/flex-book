import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { useSessionStore } from '@/features/auth/session-store';
import { useDemoLocationStore } from '@/features/device-location/demo-location-store';
import { queryClient } from '@/lib/query-client';
import { nextLocalDates, shortDateLabel } from '@/lib/time';
import { ROUTES } from '@/test-utils/app-routes';

// Render every screen in its laptop layout (sidebar, page headers, two columns).
jest.mock('@/lib/use-layout', () => ({
  WIDE_MIN_WIDTH: 1024,
  useLayout: () => ({ wide: true }),
}));

const SLOW = { timeout: 5000 };

describe('desktop layout', () => {
  beforeEach(() => {
    useSessionStore.getState().signOut();
    useDemoLocationStore.getState().setOverride(null);
    queryClient.clear();
  });

  it('gives members a sidebar and a breadcrumbed booking flow', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });
    await fireEvent.press(await screen.findByLabelText('Sign in as Member'));

    expect(await screen.findByText('Find a workspace', {}, SLOW)).toBeTruthy();
    expect(screen.getByLabelText('Main')).toBeTruthy();
    expect(screen.getByLabelText('Sign out')).toBeTruthy();
    expect(screen.getByLabelText('Documentation')).toBeTruthy();

    await fireEvent.press(await screen.findByLabelText(/Bangsar Loft/, {}, SLOW));
    expect(await screen.findByLabelText('Breadcrumb', {}, SLOW)).toBeTruthy();
    expect(screen.getByText('Local time in Kuala Lumpur')).toBeTruthy();

    await fireEvent.press(await screen.findByLabelText(/Meeting room \(4 pax\)/));
    expect(await screen.findByText('No time chosen yet', {}, SLOW)).toBeTruthy();

    const tomorrow = nextLocalDates('Asia/Kuala_Lumpur', 2)[1] ?? '';
    await fireEvent.press(await screen.findByLabelText(shortDateLabel(tomorrow), {}, SLOW));
    const freeSlots = await screen.findAllByLabelText(/^\d{1,2}:00 (AM|PM)$/, {}, SLOW);
    await fireEvent.press(freeSlots[0]!);

    expect(await screen.findByText('Your selection')).toBeTruthy();
    expect(screen.queryByText('No time chosen yet')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Continue'));
    expect(await screen.findByText('Review booking', {}, SLOW)).toBeTruthy();
    expect(screen.getByLabelText('Confirm booking')).toBeTruthy();
  });

  it('gives staff a location dropdown and a two-part walk-in form', async () => {
    await renderRouter(ROUTES, { initialUrl: '/login' });
    await fireEvent.press(await screen.findByLabelText('Sign in as Staff · Hive'));

    expect(await screen.findByText(/Today · Bangsar Loft/, {}, SLOW)).toBeTruthy();
    const dropdown = screen.getByLabelText(/^Location: Bangsar Loft/);
    await fireEvent.press(dropdown);
    await fireEvent.press(await screen.findByLabelText('Kallang Works, Singapore'));
    expect(await screen.findByText(/Today · Kallang Works/, {}, SLOW)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Walk-in'));
    expect(await screen.findByText('Space and time', {}, SLOW)).toBeTruthy();
    expect(screen.getByText('Guest')).toBeTruthy();
  });

  it('shows the documentation with a contents list', async () => {
    await renderRouter(ROUTES, { initialUrl: '/docs' });

    expect(await screen.findByLabelText('On this page')).toBeTruthy();
    expect(screen.getByText(/Not affiliated with Flexi Group/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Sign in'));
    expect(await screen.findByText('Choose a demo account')).toBeTruthy();
  });
});
