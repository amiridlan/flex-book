import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';

import type { Permission, User } from '@/api/schemas/user';

export type NavItem = {
  readonly label: string;
  readonly href: Href;
  readonly icon: ComponentProps<typeof Ionicons>['name'];
  /** Whether this item is the current section for a URL path. */
  readonly matches: (pathname: string) => boolean;
  /** Shown only to users holding this permission (the server enforces it too). */
  readonly permission?: Permission;
};

/** The items this user may see. */
export function navFor(nav: readonly NavItem[], user: User | null): readonly NavItem[] {
  return nav.filter(
    (item) => !item.permission || (user?.permissions.includes(item.permission) ?? false),
  );
}

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
    label: 'People',
    href: '/staff/users',
    icon: 'people-outline',
    matches: (p) => p.startsWith('/staff/users'),
    permission: 'users.manage',
  },
  {
    label: 'Locations',
    href: '/staff/locations',
    icon: 'business-outline',
    matches: (p) => p.startsWith('/staff/locations'),
    permission: 'locations.manage',
  },
  {
    label: 'Activity',
    href: '/staff/activity',
    icon: 'document-text-outline',
    matches: (p) => p.startsWith('/staff/activity'),
    permission: 'audit.view',
  },
  {
    label: 'Profile',
    href: '/staff/profile',
    icon: 'person-circle-outline',
    matches: (p) => p.startsWith('/staff/profile'),
  },
];
