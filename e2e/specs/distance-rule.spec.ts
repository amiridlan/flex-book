import {
  expect,
  onScreen,
  openBangsarMeetingRoom,
  openSection,
  pickFirstFreeSlotAndContinue,
  PLACES,
  signIn,
  test,
} from '../fixtures';

/** The anti-fake-booking rule, from the member's side. The server repeats every check. */
test.describe('distance rule', () => {
  test.describe('from Sydney', () => {
    test.use({ permissions: ['geolocation'], geolocation: PLACES.sydney });

    test('blocks a same-day booking more than 30 km away', async ({ page }) => {
      await signIn(page, 'member');
      await openBangsarMeetingRoom(page, /^Today · 06\/10$/);
      await pickFirstFreeSlotAndContinue(page);

      await expect(onScreen(page.getByText('You can’t book this from here'))).toBeVisible();
      await expect(onScreen(page.getByText(/must be made within 30 km/))).toBeVisible();
      await expect(onScreen(page.getByRole('button', { name: 'Confirm booking' }))).toBeDisabled();
    });

    test('blocks a later-day booking from another country', async ({ page }) => {
      await signIn(page, 'member');
      await openBangsarMeetingRoom(page, /^Wed 07\/10$/);
      await pickFirstFreeSlotAndContinue(page);

      await expect(onScreen(page.getByText(/must be made from within Malaysia/))).toBeVisible();
      await expect(onScreen(page.getByRole('button', { name: 'Confirm booking' }))).toBeDisabled();
    });
  });

  test('asks for location before booking, and explains why', async ({ page }) => {
    await signIn(page, 'member');
    await openBangsarMeetingRoom(page, /^Wed 07\/10$/);
    await pickFirstFreeSlotAndContinue(page);

    await expect(onScreen(page.getByText('We need your location to book'))).toBeVisible();
    await expect(onScreen(page.getByRole('button', { name: 'Share my location' }))).toBeVisible();
    await expect(onScreen(page.getByRole('button', { name: 'Confirm booking' }))).toBeDisabled();
  });

  test('refuses a simulated (fake GPS) location', async ({ page, wide }) => {
    await signIn(page, 'member');
    await openSection(page, wide, 'Profile');
    await onScreen(page.getByRole('button', { name: 'Fake GPS app (KL)' })).click();
    await openSection(page, wide, 'Explore');

    await openBangsarMeetingRoom(page, /^Wed 07\/10$/);
    await pickFirstFreeSlotAndContinue(page);

    await expect(onScreen(page.getByText(/reporting a simulated location/))).toBeVisible();
    await expect(onScreen(page.getByRole('button', { name: 'Confirm booking' }))).toBeDisabled();
  });
});
