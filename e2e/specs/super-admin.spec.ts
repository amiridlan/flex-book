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

  test('invites a staff member, then suspends a member with a reason', async ({ page, wide }) => {
    await signIn(page, 'superAdmin');
    await openSection(page, wide, 'People');

    await onScreen(page.getByRole('button', { name: 'Invite staff' })).click();
    await onScreen(page.getByLabel('Full name')).fill('Aina Karim');
    await onScreen(page.getByLabel('Work email')).fill('aina.karim@example.com');
    await onScreen(page.getByRole('button', { name: 'All Hive locations' })).click();
    await onScreen(page.getByRole('button', { name: 'Send invite' })).click();
    // The new account opens in the editor.
    await expect(onScreen(page.getByText('aina.karim@example.com'))).toBeVisible();

    if (!wide) await onScreen(page.getByRole('button', { name: 'Back to everyone' })).click();
    await onScreen(page.getByLabel('Olivia Brown, Member', { exact: true })).click();
    await onScreen(page.getByRole('button', { name: 'Suspend account' })).click();
    await onScreen(page.getByLabel('Why suspend?')).fill('Card payment disputed');
    await onScreen(page.getByRole('button', { name: 'Confirm suspension' })).click();
    await expect(onScreen(page.getByText(/^Suspended: they are signed out/))).toBeVisible();

    if (!wide) await onScreen(page.getByRole('button', { name: 'Back to everyone' })).click();
    await openSection(page, wide, 'Activity');
    await expect(onScreen(page.getByText('Suspended account · Olivia Brown'))).toBeVisible();
    await expect(onScreen(page.getByText('Card payment disputed'))).toBeVisible();
    await expect(onScreen(page.getByText('Invited staff · Aina Karim'))).toBeVisible();
  });

  test('flagged members link straight to their account', async ({ page, wide }) => {
    await signIn(page, 'superAdmin');
    await openSection(page, wide, 'Activity');
    const ryan = onScreen(page.getByLabel(/^Ryan Ong: 3 blocked/));
    await expect(ryan).toBeVisible();
    await ryan.click();
    await expect(onScreen(page.getByText('ryan@example.com', { exact: true }))).toBeVisible();
    await expect(onScreen(page.getByRole('button', { name: 'Reactivate account' }))).toBeVisible();
  });

  test('all-locations board, then a manual check-in with a reason', async ({ page, wide }) => {
    await signIn(page, 'superAdmin');
    await expect(onScreen(page.getByText(/^Today · /))).toBeVisible();
    if (wide) {
      await page
        .getByLabel(/^Location: /)
        .filter({ visible: true })
        .last()
        .click();
      await onScreen(page.getByRole('menuitem', { name: 'All locations' })).click();
      await expect(onScreen(page.getByRole('columnheader', { name: 'Location' }))).toBeVisible();
    } else {
      await onScreen(page.getByRole('button', { name: 'All locations' })).click();
    }
    await expect(onScreen(page.getByText('Today · All locations'))).toBeVisible();

    await onScreen(page.getByRole('button', { name: /^Override booking for / })).click();
    await onScreen(page.getByLabel('Reason')).fill('Guest arrived; the scanner was down');
    await onScreen(page.getByRole('button', { name: 'Check in manually' })).click();
    await expect(page.getByLabel('Reason')).toHaveCount(0);

    await openSection(page, wide, 'Activity');
    await expect(onScreen(page.getByText(/^Checked in manually · FXB-/))).toBeVisible();
    await expect(onScreen(page.getByText('Guest arrived; the scanner was down'))).toBeVisible();
  });

  test('other roles never see the admin screens', async ({ page, wide }) => {
    await signIn(page, 'hiveStaff');
    await expect(onScreen(page.getByText(/^Today · Bangsar Loft/))).toBeVisible();
    const role = wide ? 'link' : 'tab';
    await expect(page.getByRole(role, { name: /People/ })).toHaveCount(0);
    await expect(page.getByRole(role, { name: /Activity/ })).toHaveCount(0);
    // Front-desk staff get no all-locations board and no override buttons.
    await expect(page.getByRole('button', { name: /^Override booking/ })).toHaveCount(0);
    if (wide)
      await page
        .getByLabel(/^Location: /)
        .filter({ visible: true })
        .last()
        .click();
    await expect(page.getByText('All locations', { exact: true })).toHaveCount(0);
  });
});
