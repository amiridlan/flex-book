import { expect, test as base, type Locator, type Page } from '@playwright/test';

/**
 * Test clock start: Tue 06/10/2026, 9:50 am in Kuala Lumpur. The mock seeds today's
 * staff bookings relative to now, so this gives every run the same board:
 * a guest arriving at 10:00 (check-in open), a 9:05 no-show, a visit finished
 * at 8:20 and a later booking. At Bangsar Loft the 10:00 meeting-room slot is free.
 */
export const FIXED_NOW = new Date('2026-10-06T09:50:00+08:00');

/** Real coordinates the tests pretend to be at. */
export const PLACES = {
  bangsarLoft: { latitude: 3.1301, longitude: 101.6712 },
  klCityCentre: { latitude: 3.1478, longitude: 101.6953 },
  sydney: { latitude: -33.8688, longitude: 151.2093 },
} as const;

export const ACCOUNTS = {
  member: 'Sign in as Member',
  hiveStaff: 'Sign in as Staff · Hive',
  tcgStaff: 'Sign in as Staff · The Common Ground KL',
  superAdmin: 'Sign in as Super admin',
} as const;

type Fixtures = {
  /** True for the laptop project: sidebar and tables instead of tabs and cards. */
  wide: boolean;
};

export const test = base.extend<Fixtures>({
  wide: async ({ viewport }, use) => {
    await use((viewport?.width ?? 0) >= 1024);
  },
  page: async ({ page }, use) => {
    // Any uncaught error or console.error fails the test.
    const problems: string[] = [];
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
    });
    await page.addInitScript(shiftClock, FIXED_NOW.getTime());
    await use(page);
    expect(problems, 'browser errors during the test').toEqual([]);
  },
});

export { expect };

/**
 * Starts the browser clock at `start` and lets it run. Not `page.clock`: its fake
 * Date breaks subclasses such as @date-fns/tz's TZDate, so every location would
 * silently format in the browser's zone. A real subclass keeps them working.
 * Runs in the page, so it must be self-contained.
 */
function shiftClock(start: number): void {
  const RealDate = Date;
  const offset = start - RealDate.now();
  class ShiftedDate extends RealDate {
    constructor(...args: ConstructorParameters<DateConstructor> | []) {
      if (args.length === 0) super(RealDate.now() + offset);
      else super(...(args as ConstructorParameters<DateConstructor>));
    }
    static override now(): number {
      return RealDate.now() + offset;
    }
  }
  globalThis.Date = ShiftedDate as DateConstructor;
}

/** Tabs and stack screens stay mounted but hidden; only match what is on screen. */
export function onScreen(locator: Locator): Locator {
  return locator.filter({ visible: true }).first();
}

/**
 * Opens the app and signs in with a demo account. The session lives in memory
 * (demo only), so tests navigate inside the app and never reload.
 */
export async function signIn(page: Page, account: keyof typeof ACCOUNTS): Promise<void> {
  await page.goto('/');
  await page.getByLabel(ACCOUNTS[account]).click();
}

/**
 * Main navigation: the sidebar on laptops, the bottom tabs on phones. On a phone,
 * detail screens cover the tabs, so it goes back first, the way a user would.
 */
export async function openSection(page: Page, wide: boolean, name: string): Promise<void> {
  if (wide) {
    await onScreen(page.getByRole('link', { name, exact: true })).click();
    return;
  }
  const tab = page.getByRole('tab', { name: new RegExp(name) }).filter({ visible: true });
  const back = page.getByRole('link', { name: 'Go back' }).filter({ visible: true });
  // Look again every round: during a screen transition the old screen's back link
  // can vanish between seeing it and tapping it, and a tap can be dropped. With
  // neither on screen, use the browser's back button, as a phone user would.
  try {
    // First let the app settle on either one, so a slow first render never goes back.
    await expect(tab.or(back).first()).toBeVisible();
    await expect(async () => {
      if ((await tab.count()) === 0) {
        if ((await back.count()) > 0) await back.first().click({ timeout: 1_000 });
        else await page.goBack();
      }
      await tab.first().click({ timeout: 1_000 });
      await expect(tab.first()).toHaveAttribute('aria-selected', 'true', { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
  } catch (error) {
    // Show what was on screen, so a CI-only failure can be read from the log.
    const screen = await page.locator('body').ariaSnapshot();
    throw new Error(`Could not open the ${name} tab. Screen:\n${screen}`, { cause: error });
  }
}

export async function signOut(page: Page, wide: boolean): Promise<void> {
  if (!wide) await openSection(page, wide, 'Profile');
  await onScreen(page.getByRole('button', { name: 'Sign out' })).click();
  await expect(page.getByText('Choose a demo account', { exact: false })).toBeVisible();
}

/** From Explore: open Bangsar Loft's meeting room and pick a date chip. */
export async function openBangsarMeetingRoom(page: Page, dateLabel: RegExp): Promise<void> {
  await onScreen(page.getByLabel(/^Bangsar Loft/)).click();
  await onScreen(page.getByLabel(/Meeting room \(4 pax\)/)).click();
  await onScreen(page.getByRole('button', { name: dateLabel })).click();
}

/** Picks the first free hourly slot and continues to the review screen. */
export async function pickFirstFreeSlotAndContinue(page: Page): Promise<string> {
  const slot = onScreen(page.getByRole('button', { name: /^\d{1,2}:00 (AM|PM)$/ }));
  const label = (await slot.getAttribute('aria-label')) ?? '';
  await slot.click();
  await expect(onScreen(page.getByText('Your selection'))).toBeVisible();
  await onScreen(page.getByRole('button', { name: 'Continue' })).click();
  return label;
}
