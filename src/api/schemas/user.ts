import { z } from 'zod';

import { brandIdSchema } from './brand';

export const roleSchema = z.enum(['member', 'staff', 'brand_admin', 'group_admin']);
export type Role = z.infer<typeof roleSchema>;

export const permissionSchema = z.enum([
  'locations.view',
  'bookings.create',
  'bookings.view_own',
  'staff.dashboard',
  'bookings.view_location',
  'bookings.check_in',
  'bookings.walk_in',
  'spaces.block',
  'spaces.manage',
  'reports.view',
  'brands.manage',
]);
export type Permission = z.infer<typeof permissionSchema>;

/** A staff member's scope. `locationId: null` means every location of the brand. */
export const assignmentSchema = z.object({
  brandId: brandIdSchema,
  locationId: z.string().nullable(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: roleSchema,
  assignments: z.array(assignmentSchema).readonly(),
  permissions: z.array(permissionSchema).readonly(),
});
export type User = z.infer<typeof userSchema>;

export const loginResponseSchema = z.object({
  data: z.object({ token: z.string().min(1), user: userSchema }),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>['data'];
