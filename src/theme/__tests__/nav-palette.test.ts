import { BRANDS } from '@/api/mock/db/brands';

import { mixChannels, navPalette, NEUTRAL_NAV, type NavPalette } from '../nav-palette';

/** WCAG 2.x contrast ratio between two channel colours. */
function contrast(a: string, b: string): number {
  const luminance = (channels: string) => {
    const [r = 0, g = 0, bl = 0] = channels.split(' ').map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

const palettes: [string, NavPalette][] = [
  ['neutral', NEUTRAL_NAV],
  ...BRANDS.map((brand): [string, NavPalette] => [brand.name, navPalette(brand.theme)]),
];

describe('navigation palette', () => {
  it('falls back to the neutral slate when no brand applies', () => {
    expect(navPalette(undefined)).toBe(NEUTRAL_NAV);
  });

  it('shades the brand colour for the background and uses it for the selected item', () => {
    const hive = navPalette(BRANDS.find((b) => b.id === 'hive')?.theme);
    expect(hive.active).toBe('161 92 7');
    expect(hive.background).toBe('81 46 4');
    expect(hive.text).toBe('255 255 255');
  });

  it('mixes channel colours', () => {
    expect(mixChannels('255 255 255', '0 0 0', 0.5)).toBe('128 128 128');
  });

  it.each(palettes)('%s: every text colour passes WCAG AA (4.5:1)', (_name, palette) => {
    expect(contrast(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.muted, palette.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.text, palette.active)).toBeGreaterThanOrEqual(4.5);
  });
});
