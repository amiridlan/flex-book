import type { Permission, Role, User } from '../../schemas/user';

const MEMBER: readonly Permission[] = ['locations.view', 'bookings.create', 'bookings.view_own'];
const STAFF: readonly Permission[] = [
  'locations.view',
  'staff.dashboard',
  'bookings.view_location',
  'bookings.check_in',
  'bookings.walk_in',
  'spaces.block',
];
const BRAND_ADMIN: readonly Permission[] = [...STAFF, 'spaces.manage', 'reports.view'];
const GROUP_ADMIN: readonly Permission[] = [...BRAND_ADMIN, 'brands.manage'];

export const PERMISSIONS_BY_ROLE: Readonly<Record<Role, readonly Permission[]>> = {
  member: MEMBER,
  staff: STAFF,
  brand_admin: BRAND_ADMIN,
  group_admin: GROUP_ADMIN,
};

type SeedUser = Omit<User, 'permissions'>;

/** Fictional demo accounts. Emails use the reserved example.com domain. */
const SEED_USERS: readonly SeedUser[] = [
  {
    id: 'usr_member',
    name: 'Aisyah Rahman',
    email: 'aisyah@example.com',
    role: 'member',
    assignments: [],
  },
  {
    id: 'usr_staff_hive',
    name: 'Daniel Wong',
    email: 'daniel.hive@example.com',
    role: 'staff',
    assignments: [{ brandId: 'hive', locationId: null }],
  },
  {
    id: 'usr_staff_tcg_kul',
    name: 'Priya Nair',
    email: 'priya.tcg@example.com',
    role: 'staff',
    assignments: [{ brandId: 'tcg', locationId: 'loc_tcg_kul' }],
  },
  {
    id: 'usr_admin_clustered',
    name: 'Minh Tran',
    email: 'minh.clustered@example.com',
    role: 'brand_admin',
    assignments: [{ brandId: 'clustered', locationId: null }],
  },
  {
    id: 'usr_group_admin',
    name: 'Sarah Lim',
    email: 'sarah.group@example.com',
    role: 'group_admin',
    assignments: [],
  },
];

export const USERS: readonly User[] = SEED_USERS.map((user) => ({
  ...user,
  permissions: PERMISSIONS_BY_ROLE[user.role],
}));

/** Demo only: every mock account accepts this password. Real auth is Laravel Sanctum. */
export const DEMO_PASSWORD = 'demo1234';
