import { expect, onScreen, openSection, signIn, signOut, test } from '../fixtures';

test.describe('super admin', () => {
  test('gives a staff member a second location; they see it and the log records it', async ({
    page,
    wide,
  }) => {
    await signIn(page, 'superAdmin');
    await openSection(page, wide, 'People');
    await expect(onScreen(page.getByText('People and access'))).toBeVisible();

    await onScreen(page.getByLabel('Priya Nair, Staff', { exact: true })).click();
    await onScreen(page.getByRole('button', { name: 'Telok Commons · Singapore' })).click();
    await expect(
      onScreen(page.getByText(/Menara Aurora; The Common Ground · Telok Commons$/)),
    ).toBeVisible();
    await onScreen(page.getByRole('button', { name: 'Save access' })).click();
    await expect(onScreen(page.getByText(/^Saved\. It applies on Priya/))).toBeVisible();

    if (!wide) await onScreen(page.getByRole('button', { name: 'Back to everyone' })).click();
    await openSection(page, wide, 'Activity');
    await expect(onScreen(page.getByText('Changed access · Priya Nair'))).toBeVisible();
    await expect(onScreen(page.getByText('By Farid Hassan'))).toBeVisible();

    await signOut(page, wide);
    await page.getByLabel('Sign in as Staff · The Common Ground KL').click();
    await expect(onScreen(page.getByText(/^Today · Menara Aurora/))).toBeVisible();
    if (wide)
      await page
        .getByLabel(/^Location: /)
        .filter({ visible: true })
        .last()
        .click();
    await expect(onScreen(page.getByLabel(/^Telok Commons/))).toBeVisible();
  });

  test('other roles never see the admin screens', async ({ page, wide }) => {
    await signIn(page, 'hiveStaff');
    await expect(onScreen(page.getByText(/^Today · Bangsar Loft/))).toBeVisible();
    const role = wide ? 'link' : 'tab';
    await expect(page.getByRole(role, { name: /People/ })).toHaveCount(0);
    await expect(page.getByRole(role, { name: /Activity/ })).toHaveCount(0);
  });
});
