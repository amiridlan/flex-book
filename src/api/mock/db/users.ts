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
const SUPER_ADMIN: readonly Permission[] = [
  ...GROUP_ADMIN,
  'users.manage',
  'audit.view',
  'bookings.override',
  'locations.manage',
];

export const PERMISSIONS_BY_ROLE: Readonly<Record<Role, readonly Permission[]>> = {
  member: MEMBER,
  staff: STAFF,
  brand_admin: BRAND_ADMIN,
  group_admin: GROUP_ADMIN,
  super_admin: SUPER_ADMIN,
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
  {
    id: 'usr_super_admin',
    name: 'Farid Hassan',
    email: 'farid.super@example.com',
    role: 'super_admin',
    assignments: [],
  },
  // More staff, each with a different kind of access.
  {
    id: 'usr_staff_tcg_multi',
    name: 'Wei Jie Tan',
    email: 'weijie.tcg@example.com',
    role: 'staff',
    // Two locations of one brand.
    assignments: [
      { brandId: 'tcg', locationId: 'loc_tcg_kul' },
      { brandId: 'tcg', locationId: 'loc_tcg_sin' },
    ],
  },
  {
    id: 'usr_staff_cross_brand',
    name: 'Nurul Huda',
    email: 'nurul.staff@example.com',
    role: 'staff',
    // One location each in two brands.
    assignments: [
      { brandId: 'hive', locationId: 'loc_hive_kul' },
      { brandId: 'clustered', locationId: 'loc_clustered_pen' },
    ],
  },
  {
    id: 'usr_staff_hive_mel',
    name: 'Ben Carter',
    email: 'ben.hive@example.com',
    role: 'staff',
    assignments: [{ brandId: 'hive', locationId: 'loc_hive_mel' }],
  },
  {
    id: 'usr_admin_tcg',
    name: 'Kenji Sato',
    email: 'kenji.tcg@example.com',
    role: 'brand_admin',
    assignments: [{ brandId: 'tcg', locationId: null }],
  },
  // More members, from different countries.
  {
    id: 'usr_member_sg',
    name: 'Marcus Lee',
    email: 'marcus@example.com',
    role: 'member',
    assignments: [],
  },
  {
    id: 'usr_member_vn',
    name: 'Linh Pham',
    email: 'linh@example.com',
    role: 'member',
    assignments: [],
  },
  {
    id: 'usr_member_au',
    name: 'Olivia Brown',
    email: 'olivia@example.com',
    role: 'member',
    assignments: [],
  },
];

export const USERS: readonly User[] = SEED_USERS.map((user) => ({
  ...user,
  permissions: PERMISSIONS_BY_ROLE[user.role],
}));

/** Demo only: every mock account accepts this password. Real auth is Laravel Sanctum. */
export const DEMO_PASSWORD = 'demo1234';
