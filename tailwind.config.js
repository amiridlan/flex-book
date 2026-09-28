/** @param {string} name */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Replaces (not extends) Tailwind's palette: only project tokens exist, so
    // `bg-blue-500` fails to style and hard-coded colours can't creep in.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      primary: {
        DEFAULT: token('primary'),
        soft: token('primary-soft'),
      },
      'on-primary': token('on-primary'),
      background: token('background'),
      surface: {
        DEFAULT: token('surface'),
        muted: token('surface-muted'),
      },
      border: token('border'),
      text: {
        DEFAULT: token('text'),
        muted: token('text-muted'),
      },
      danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
      success: { DEFAULT: token('success'), soft: token('success-soft') },
      warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
      sidebar: {
        DEFAULT: token('sidebar'),
        active: token('sidebar-active'),
        text: token('sidebar-text'),
        muted: token('sidebar-muted'),
      },
    },
    extend: {
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
};
