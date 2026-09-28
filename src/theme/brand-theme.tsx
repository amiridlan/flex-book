import { vars } from 'nativewind';
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import type { BrandTheme } from '@/api/schemas/brand';

/** `#2F6B4F` -> `47 107 79`, the channel format the CSS tokens use. */
export function hexToChannels(hex: string): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Invalid hex colour: ${hex}`);
  return [match[1], match[2], match[3]].map((part) => parseInt(part ?? '0', 16)).join(' ');
}

export function brandVars(theme: BrandTheme) {
  return vars({
    '--color-primary': hexToChannels(theme.primary),
    '--color-on-primary': hexToChannels(theme.onPrimary),
    '--color-primary-soft': hexToChannels(theme.primarySoft),
  });
}

type BrandThemeScopeProps = ViewProps & {
  readonly theme: BrandTheme | undefined;
  readonly children: ReactNode;
};

/**
 * Re-points the `primary` tokens for everything inside it, so `bg-primary`
 * renders in the brand's colour. The brand's theme is API data: adding a brand
 * needs no code change.
 */
export function BrandThemeScope({ theme, style, children, ...rest }: BrandThemeScopeProps) {
  return (
    <View {...rest} style={[theme ? brandVars(theme) : undefined, style]}>
      {children}
    </View>
  );
}
