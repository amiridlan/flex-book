/**
 * Colour tokens as space-separated RGB channels. This is the JS mirror of the
 * `:root` block in src/global.css (a unit test keeps them in sync). Use Tailwind
 * classes in components; use `colors` only where a raw value is required
 * (tab bar tint, icons, ActivityIndicator).
 */
export const colorTokens = {
  primary: '15 118 110',
  'on-primary': '255 255 255',
  'primary-soft': '204 251 241',
  background: '248 250 252',
  surface: '255 255 255',
  'surface-muted': '241 245 249',
  border: '226 232 240',
  text: '15 23 42',
  'text-muted': '71 85 105',
  danger: '185 28 28',
  'danger-soft': '254 226 226',
  success: '21 128 61',
  'success-soft': '220 252 231',
  warning: '161 98 7',
  'warning-soft': '254 243 199',
  sidebar: '15 23 42',
  'sidebar-active': '30 41 59',
  'sidebar-text': '226 232 240',
  'sidebar-muted': '148 163 184',
} as const;

export type ColorToken = keyof typeof colorTokens;

export function rgb(channels: string): string {
  return `rgb(${channels.split(' ').join(', ')})`;
}

export const colors = Object.fromEntries(
  Object.entries(colorTokens).map(([name, channels]) => [name, rgb(channels)]),
) as Readonly<Record<ColorToken, string>>;
