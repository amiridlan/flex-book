import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';

export type NavItem = {
  readonly label: string;
  readonly href: Href;
  readonly icon: ComponentProps<typeof Ionicons>['name'];
  /** Whether this item is the current section for a URL path. */
  readonly matches: (pathname: string) => boolean;
};

/** Member sections. Location and time pages belong to Explore; booking pages to Bookings. */
export const MEMBER_NAV: readonly NavItem[] = [
  {
    label: 'Explore',
    href: '/',
    icon: 'search',
    matches: (p) => p === '/' || p.startsWith('/locations'),
  },
  {
    label: 'Bookings',
    href: '/bookings',
    icon: 'calendar-outline',
    matches: (p) => p.startsWith('/bookings'),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: 'person-circle-outline',
    matches: (p) => p.startsWith('/profile'),
  },
];

export const STAFF_NAV: readonly NavItem[] = [
  { label: 'Today', href: '/staff', icon: 'today-outline', matches: (p) => p === '/staff' },
  {
    label: 'Scan',
    href: '/staff/scan',
    icon: 'qr-code-outline',
    matches: (p) => p.startsWith('/staff/scan'),
  },
  {
    label: 'Walk-in',
    href: '/staff/walk-in',
    icon: 'person-add-outline',
    matches: (p) => p.startsWith('/staff/walk-in'),
  },
  {
    label: 'Profile',
    href: '/staff/profile',
    icon: 'person-circle-outline',
    matches: (p) => p.startsWith('/staff/profile'),
  },
];
