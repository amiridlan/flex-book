import { vars } from 'nativewind';

import type { BrandTheme } from '@/api/schemas/brand';

import { hexToChannels } from './brand-theme';
import { colorTokens, rgb } from './tokens';

/** Navigation colours as RGB channels, the same format as the CSS tokens. */
export type NavPalette = {
  /** Sidebar, tab bar and header background. */
  readonly background: string;
  /** The selected item's background. */
  readonly active: string;
  /** Labels and the selected item's text. */
  readonly text: string;
  /** Unselected labels and icons. */
  readonly muted: string;
  /** Thin bar marking the selected item. */
  readonly indicator: string;
};

/** Slate shell for screens that show every brand (Explore, My bookings, Profile). */
export const NEUTRAL_NAV: NavPalette = {
  background: colorTokens.sidebar,
  active: colorTokens['sidebar-active'],
  text: colorTokens['sidebar-text'],
  muted: colorTokens['sidebar-muted'],
  indicator: colorTokens['sidebar-indicator'],
};

/** Share of black mixed into the brand colour for the background: dark enough to stay calm. */
const SHADE = 0.5;
/** Share of the text colour in muted labels; the rest is the background. */
const MUTED_WEIGHT = 0.72;

function parse(channels: string): readonly [number, number, number] {
  const [r = 0, g = 0, b = 0] = channels.split(' ').map(Number);
  return [r, g, b];
}

/** Blends two channel colours; `weight` is the share of `a`. */
export function mixChannels(a: string, b: string, weight: number): string {
  const ca = parse(a);
  const cb = parse(b);
  return ca.map((value, i) => Math.round(value * weight + (cb[i] ?? 0) * (1 - weight))).join(' ');
}

/**
 * Derives the navigation colours from a brand theme, so a new brand needs no
 * code: a deep shade of the brand colour behind, the brand colour itself for the
 * selected item, and the brand's own "on primary" colour for text. A unit test
 * checks every brand's pairs pass WCAG AA.
 */
export function navPalette(theme: BrandTheme | undefined): NavPalette {
  if (!theme) return NEUTRAL_NAV;
  const primary = hexToChannels(theme.primary);
  const onPrimary = hexToChannels(theme.onPrimary);
  const background = mixChannels(primary, '0 0 0', 1 - SHADE);
  return {
    background,
    active: primary,
    text: onPrimary,
    muted: mixChannels(onPrimary, background, MUTED_WEIGHT),
    indicator: hexToChannels(theme.primarySoft),
  };
}

/** Re-points the `sidebar-*` tokens for everything inside the view that gets this style. */
export function navVars(palette: NavPalette) {
  return vars({
    '--color-sidebar': palette.background,
    '--color-sidebar-active': palette.active,
    '--color-sidebar-text': palette.text,
    '--color-sidebar-muted': palette.muted,
    '--color-sidebar-indicator': palette.indicator,
  });
}

/** `rgb(...)` for places that need a raw colour: icons, tab bar, stack header. */
export function navColor(palette: NavPalette, key: keyof NavPalette): string {
  return rgb(palette[key]);
}
