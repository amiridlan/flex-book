import type { Permission, User } from '@/api/schemas/user';

/** Screens ask "may this user do X?", never "is this user role Y?". */
export function hasPermission(user: User | null, permission: Permission): boolean {
  return user?.permissions.includes(permission) ?? false;
}

/** Staff-type users land on the staff area; everyone else on member Explore. */
export function isStaffArea(user: User | null): boolean {
  return hasPermission(user, 'staff.dashboard');
}

export const ROLE_LABELS: Readonly<Record<User['role'], string>> = {
  member: 'Member',
  staff: 'Staff',
  brand_admin: 'Brand admin',
  group_admin: 'Group admin',
  super_admin: 'Super admin',
};
