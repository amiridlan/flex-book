import { readFileSync } from 'fs';
import { join } from 'path';

import { hexToChannels } from '../brand-theme';
import { colorTokens } from '../tokens';

describe('colour tokens', () => {
  it('keeps src/global.css and tokens.ts in sync', () => {
    const css = readFileSync(join(__dirname, '../../global.css'), 'utf8');
    const fromCss = Object.fromEntries(
      [...css.matchAll(/--color-([a-z-]+):\s*([\d ]+);/g)].map((m) => [m[1], m[2]?.trim()]),
    );

    expect(fromCss).toEqual(colorTokens);
  });

  it('converts brand hex colours to RGB channels', () => {
    expect(hexToChannels('#2F6B4F')).toBe('47 107 79');
    expect(() => hexToChannels('green')).toThrow();
  });
});
