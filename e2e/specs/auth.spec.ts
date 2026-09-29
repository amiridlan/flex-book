import { expect, onScreen, openSection, signIn, signOut, test } from '../fixtures';

test.describe('sign-in and access', () => {
  test('signed-out visitors are sent to sign-in', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.getByText('Choose a demo account', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Sign in as Member')).toBeVisible();
  });

  test('a member lands on Explore and can sign out', async ({ page, wide }) => {
    await signIn(page, 'member');
    await expect(
      onScreen(page.getByText(wide ? 'Find a workspace' : 'Hi Aisyah', { exact: true })),
    ).toBeVisible();
    await expect(onScreen(page.getByText('Menara Aurora', { exact: true }))).toBeVisible();

    await signOut(page, wide);
  });

  test('staff land on their own location board, not the member area', async ({ page, wide }) => {
    await signIn(page, 'hiveStaff');
    await expect(onScreen(page.getByText(/^Today · Bangsar Loft/))).toBeVisible();

    await openSection(page, wide, 'Scan');
    await expect(onScreen(page.getByText('Check in a member'))).toBeVisible();
    // Member-only screens are not reachable from the staff area.
    await expect(page.getByText('Find a workspace')).toHaveCount(0);
  });
});
