/**
 * DEMO ONLY: one-tap accounts for the demo. They exist only in the mock
 * API. A real build shows an email/password form backed by Laravel Sanctum.
 */
export type DemoAccount = {
  readonly email: string;
  readonly title: string;
  readonly description: string;
};

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    email: 'aisyah@example.com',
    title: 'Member',
    description: 'Aisyah · browses and books every brand',
  },
  {
    email: 'daniel.hive@example.com',
    title: 'Staff · Hive',
    description: 'Daniel · all Hive locations',
  },
  {
    email: 'priya.tcg@example.com',
    title: 'Staff · The Common Ground KL',
    description: 'Priya · one location only',
  },
  {
    email: 'minh.clustered@example.com',
    title: 'Brand admin · Clustered',
    description: 'Minh · every Clustered location',
  },
  {
    email: 'sarah.group@example.com',
    title: 'Group admin',
    description: 'Sarah · all brands',
  },
  {
    email: 'farid.super@example.com',
    title: 'Super admin',
    description: 'Farid · manages people, access and settings',
  },
];

export const DEMO_PASSWORD = 'demo1234';
