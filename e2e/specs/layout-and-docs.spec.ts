import { expect, onScreen, openSection, signIn, test } from '../fixtures';

test.describe('laptop layout', () => {
  test.skip(({ wide }) => !wide, 'desktop only');

  test('sidebar, breadcrumbs and the bookings table', async ({ page, wide }) => {
    await signIn(page, 'member');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();

    await onScreen(page.getByLabel(/^Bangsar Loft/)).click();
    await onScreen(page.getByLabel(/Meeting room \(4 pax\)/)).click();
    await expect(onScreen(page.getByText('No time chosen yet'))).toBeVisible();

    // Breadcrumb back up one level.
    await onScreen(page.getByRole('link', { name: 'Bangsar Loft' })).click();
    await expect(onScreen(page.getByText('Book a space'))).toBeVisible();

    await openSection(page, wide, 'Bookings');
    // A new member has no upcoming bookings; their past visit shows under Past.
    await onScreen(page.getByRole('button', { name: 'Past' })).click();
    await expect(onScreen(page.getByRole('table', { name: /bookings/i }))).toBeVisible();
  });

  test('staff switch location from the header dropdown', async ({ page }) => {
    await signIn(page, 'hiveStaff');
    await page.getByLabel(/^Location: Bangsar Loft/).click();
    await page.getByRole('menuitem', { name: /^Kallang Works/ }).click();
    await expect(onScreen(page.getByText(/^Today · Kallang Works/))).toBeVisible();
  });
});

test.describe('phone layout', () => {
  test.skip(({ wide }) => wide, 'phone only');

  test('bottom tabs instead of a sidebar', async ({ page }) => {
    await signIn(page, 'member');
    await expect(onScreen(page.getByRole('tab', { name: /Bookings/ }))).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
  });
});

test.describe('time zones and currency', () => {
  test('a Melbourne room shows Melbourne time and warns about the phone’s zone', async ({
    page,
  }) => {
    await signIn(page, 'member');
    await onScreen(page.getByRole('button', { name: 'Australia' })).click();
    await onScreen(page.getByLabel(/^Collingwood Works/)).click();
    // Australian prices carry GST, not Malaysia's SST.
    await expect(onScreen(page.getByText('excl. GST'))).toBeVisible();

    await onScreen(page.getByLabel(/Meeting room \(4 pax\)/)).click();
    // 6 October is after Melbourne's daylight-saving change (GMT+11).
    await expect(onScreen(page.getByText(/Times are in Melbourne time \(GMT\+11\)/))).toBeVisible();
    await expect(onScreen(page.getByText(/Your phone is on GMT\+8/))).toBeVisible();
  });
});

test.describe('documentation page', () => {
  test('opens before sign-in and returns to it', async ({ page, wide }) => {
    await page.goto('/');
    await page
      .getByText(/^About this demo/)
      .first()
      .click();
    await expect(onScreen(page.getByText('Tech stack', { exact: true }))).toBeVisible();
    await expect(onScreen(page.getByText('Hosting and delivery', { exact: true }))).toBeVisible();

    if (wide) {
      await page.getByRole('link', { name: 'Hosting and delivery' }).click();
      await expect(page.getByText('Built, not hosted')).toBeInViewport();
      await page.getByRole('button', { name: 'Sign in' }).click();
    } else {
      await page.getByLabel('Back').click();
    }
    await expect(page.getByLabel('Sign in as Member')).toBeVisible();
  });
});
