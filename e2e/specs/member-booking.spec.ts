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

test.describe('member booking', () => {
  test.use({ permissions: ['geolocation'] });

  test.describe('from elsewhere in Malaysia', () => {
    test.use({ geolocation: PLACES.klCityCentre });

    test('books tomorrow, gets a QR code, finds it in My bookings, then cancels', async ({
      page,
      wide,
    }) => {
      await signIn(page, 'member');
      await openBangsarMeetingRoom(page, /^Wed 07\/10$/);
      await pickFirstFreeSlotAndContinue(page);

      // Price in ringgit with Malaysian SST, and the location rule passes.
      await expect(onScreen(page.getByText('SST 8%'))).toBeVisible();
      await expect(onScreen(page.getByText('RM 71.28'))).toBeVisible();
      await expect(onScreen(page.getByText('You can book this space'))).toBeVisible();
      await onScreen(page.getByRole('button', { name: 'Confirm booking' })).click();

      await expect(onScreen(page.getByText('You’re booked in!'))).toBeVisible();
      await expect(onScreen(page.getByLabel(/^Check-in QR code for booking FXB-/))).toBeVisible();
      const ref = await onScreen(page.getByText(/^Ref FXB-[A-Z0-9]{4}$/)).innerText();
      const code = ref.replace('Ref ', '');

      await openSection(page, wide, 'Bookings');
      await onScreen(page.getByLabel(/^Meeting room \(4 pax\) at Bangsar Loft/)).click();
      await expect(onScreen(page.getByText(`Ref ${code}`, { exact: true }))).toBeVisible();
      await onScreen(page.getByRole('button', { name: 'Cancel booking' })).click();
      await onScreen(page.getByRole('button', { name: 'Yes, cancel booking' })).click();
      await expect(onScreen(page.getByText('Cancelled', { exact: true }))).toBeVisible();
    });
  });

  test.describe('on site', () => {
    test.use({ geolocation: PLACES.bangsarLoft });

    test('books a room starting in 10 minutes and checks in from the phone', async ({ page }) => {
      await signIn(page, 'member');
      await openBangsarMeetingRoom(page, /^Today · 06\/10$/);
      const slot = await pickFirstFreeSlotAndContinue(page);
      expect(slot).toBe('10:00 AM');

      await onScreen(page.getByRole('button', { name: 'Confirm booking' })).click();
      await expect(onScreen(page.getByText('You’re booked in!'))).toBeVisible();

      // Check-in opens 15 minutes before the start and needs the phone within 200 m.
      await onScreen(page.getByRole('button', { name: 'Check in here' })).click();
      await expect(onScreen(page.getByText(/^Checked in at 9:5\d AM$/))).toBeVisible();
    });
  });
});
