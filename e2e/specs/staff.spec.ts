import type { Page } from '@playwright/test';

import {
  expect,
  onScreen,
  openBangsarMeetingRoom,
  openSection,
  pickFirstFreeSlotAndContinue,
  PLACES,
  signIn,
  signOut,
  test,
} from '../fixtures';

/** Sets the desk's location: the header dropdown on laptops, the chips on phones. */
async function chooseDesk(page: Page, wide: boolean, name: string): Promise<void> {
  if (wide) {
    // Today stays mounted under Scan with its own dropdown in the same spot; the
    // screen on top is rendered last.
    await page
      .getByLabel(/^Location: /)
      .filter({ visible: true })
      .last()
      .click();
    await onScreen(page.getByRole('menuitem', { name: new RegExp(`^${name}`) })).click();
  } else {
    await onScreen(page.getByRole('button', { name: new RegExp(`^${name} · `) })).click();
  }
}

test.describe('staff', () => {
  test('Hive staff see only Hive locations', async ({ page, wide }) => {
    await signIn(page, 'hiveStaff');
    await expect(onScreen(page.getByText(/^Today · Bangsar Loft/))).toBeVisible();

    if (wide) await page.getByLabel(/^Location: Bangsar Loft/).click();
    for (const other of ['Kallang Works', 'Wan Chai Studio', 'Collingwood Works']) {
      await expect(onScreen(page.getByLabel(new RegExp(`^${other}`)))).toBeVisible();
    }
    // The Common Ground's KL location belongs to another brand.
    await expect(page.getByText(/Menara Aurora/)).toHaveCount(0);
  });

  test('single-location staff get no location switcher', async ({ page }) => {
    await signIn(page, 'tcgStaff');
    await expect(onScreen(page.getByText(/^Today · Menara Aurora/))).toBeVisible();
    await expect(page.getByLabel(/^Location: /)).toHaveCount(0);
    await expect(page.getByText(/Bangsar Loft/)).toHaveCount(0);
  });

  test('checks in the guest who is arriving now', async ({ page }) => {
    await signIn(page, 'hiveStaff');
    await expect(onScreen(page.getByLabel('1 Arriving'))).toBeVisible();

    await onScreen(page.getByRole('button', { name: /^Check in / })).click();

    await expect(onScreen(page.getByLabel('0 Arriving'))).toBeVisible();
    await expect(onScreen(page.getByLabel('2 Checked in'))).toBeVisible();
    // The 9:05 guest never came: the board shows them as a no-show.
    await expect(onScreen(page.getByLabel('1 No-shows'))).toBeVisible();
  });

  test('walk-in: shows field errors, then books and checks the guest in', async ({
    page,
    wide,
  }) => {
    await signIn(page, 'hiveStaff');
    await openSection(page, wide, 'Walk-in');

    await onScreen(page.getByRole('button', { name: 'Book and check in' })).click();
    await expect(onScreen(page.getByText('Choose a space.'))).toBeVisible();
    await expect(onScreen(page.getByText('Enter the guest’s name.'))).toBeVisible();
    await expect(onScreen(page.getByText('Enter a valid email address.'))).toBeVisible();

    await onScreen(page.getByRole('button', { name: /^Meeting room \(4 pax\)/ })).click();
    await onScreen(page.getByRole('button', { name: /^\d{1,2}:00 (AM|PM)$/ })).click();
    await onScreen(page.getByLabel('Guest name')).fill('Nur Aina');
    await onScreen(page.getByLabel('Guest email')).fill('nur.aina@example.com');
    await onScreen(page.getByRole('button', { name: 'Book and check in' })).click();

    await expect(onScreen(page.getByText('Nur Aina is booked in and checked in'))).toBeVisible();
  });

  test.describe('member books, front desk checks them in by code', () => {
    test.use({ permissions: ['geolocation'], geolocation: PLACES.bangsarLoft });

    test('the booking code works at the front desk', async ({ page, wide }) => {
      await signIn(page, 'member');
      await openBangsarMeetingRoom(page, /^Today · 06\/10$/);
      await pickFirstFreeSlotAndContinue(page);
      await onScreen(page.getByRole('button', { name: 'Confirm booking' })).click();
      const ref = await onScreen(page.getByText(/^Ref FXB-[A-Z0-9]{4}$/)).innerText();
      const code = ref.replace('Ref ', '');
      await signOut(page, wide);

      await page.getByLabel('Sign in as Staff · Hive').click();
      await openSection(page, wide, 'Scan');

      // At the wrong desk (Singapore), the Kuala Lumpur booking is refused.
      await chooseDesk(page, wide, 'Kallang Works');
      await expect(onScreen(page.getByText(/^Kallang Works, Singapore ·/))).toBeVisible();
      await onScreen(page.getByLabel('Booking code')).fill(code);
      await onScreen(page.getByRole('button', { name: 'Check in with code' })).click();
      await expect(onScreen(page.getByText(/This booking is at Bangsar Loft/))).toBeVisible();

      // At the right desk it goes through. Typed in lower case: the desk normalises it.
      await chooseDesk(page, wide, 'Bangsar Loft');
      await onScreen(page.getByLabel('Booking code')).fill(code.toLowerCase());
      await onScreen(page.getByRole('button', { name: 'Check in with code' })).click();

      await expect(onScreen(page.getByText('Aisyah Rahman is checked in'))).toBeVisible();
    });

    test('an unknown code is rejected', async ({ page, wide }) => {
      await signIn(page, 'hiveStaff');
      await openSection(page, wide, 'Scan');
      await onScreen(page.getByLabel('Booking code')).fill('FXB-ZZZZ');
      await onScreen(page.getByRole('button', { name: 'Check in with code' })).click();
      await expect(
        onScreen(page.getByText('No booking with that code at your locations.')),
      ).toBeVisible();
    });
  });
});
