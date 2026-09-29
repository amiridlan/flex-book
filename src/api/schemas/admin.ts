import { z } from 'zod';

import { isoDateTimeSchema } from './common';
import { assignmentSchema, roleSchema, userSchema } from './user';

export const accountStatusSchema = z.enum(['active', 'suspended']);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

/** A user as the super admin sees them: their access plus account status. */
export const adminUserSchema = userSchema.extend({ status: accountStatusSchema });
export type AdminUser = z.infer<typeof adminUserSchema>;

/** Replace a user's role and access in one change. The server validates the pair. */
export const updateAccessSchema = z.object({
  role: roleSchema,
  assignments: z.array(assignmentSchema),
});
export type UpdateAccessInput = z.infer<typeof updateAccessSchema>;

/** Suspend or reactivate an account. The reason goes into the audit trail. */
export const updateStatusSchema = z.object({
  status: accountStatusSchema,
  reason: z.string().trim().min(3, 'Say why, for the activity log.').max(200),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

/** Super admin override on any booking. The reason goes into the audit trail. */
export const overrideBookingSchema = z.object({
  action: z.enum(['cancel', 'check_in']),
  reason: z.string().trim().min(3, 'Say why, for the activity log.').max(200),
});
export type OverrideBookingInput = z.infer<typeof overrideBookingSchema>;

const bookingRulesSchema = z.object({
  sameDayRadiusKm: z.number().min(1, 'Use at least 1 km.').max(200, 'Use 200 km or less.'),
  checkInRadiusM: z
    .number()
    .int('Use whole metres.')
    .min(50, 'Use at least 50 m: GPS is rarely more precise.')
    .max(2000, 'Use 2,000 m or less.'),
});

/** A location as the super admin manages it: open or closed, its spaces, its rules. */
export const locationSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  brandId: z.string(),
  closed: z.boolean(),
  closedReason: z.string().nullable(),
  bookingRules: bookingRulesSchema,
  spaces: z.array(z.object({ id: z.string(), name: z.string(), closed: z.boolean() })),
});
export type LocationSettingsView = z.infer<typeof locationSettingsSchema>;

export const updateLocationSettingsSchema = z.object({
  closed: z.boolean().optional(),
  bookingRules: bookingRulesSchema.optional(),
  reason: z.string().trim().min(3, 'Say why, for the activity log.').max(200),
});
export type UpdateLocationSettingsInput = z.infer<typeof updateLocationSettingsSchema>;

export const updateSpaceSettingsSchema = z.object({
  closed: z.boolean(),
  reason: z.string().trim().min(3, 'Say why, for the activity log.').max(200),
});
export type UpdateSpaceSettingsInput = z.infer<typeof updateSpaceSettingsSchema>;

/** Roles a super admin can invite. Members sign up themselves. */
export const invitableRoleSchema = z.enum(['staff', 'brand_admin', 'group_admin', 'super_admin']);

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter their full name.').max(80, 'Name is too long.'),
  email: z.email('Enter a valid email address.'),
  role: invitableRoleSchema,
  assignments: z.array(assignmentSchema),
});
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const auditActionSchema = z.enum([
  'access.updated',
  'account.suspended',
  'account.reactivated',
  'staff.invited',
  'booking.cancelled',
  'booking.checked_in',
  'location.closed',
  'location.reopened',
  'space.closed',
  'space.reopened',
  'rules.updated',
]);
export type AuditAction = z.infer<typeof auditActionSchema>;

/**
 * One entry in the audit trail: a structured record, not a free-text line, so it
 * can be filtered, exported and shipped to a log store (CloudWatch, for example)
 * without parsing. Every admin action writes one.
 */
export const auditEventSchema = z.object({
  id: z.string(),
  at: isoDateTimeSchema,
  action: auditActionSchema,
  actor: z.object({ id: z.string(), name: z.string() }),
  target: z.object({
    type: z.enum(['user', 'booking', 'location', 'space']),
    id: z.string(),
    label: z.string(),
  }),
  /** What changed, as human-readable before/after values. */
  changes: z.array(z.object({ field: z.string(), from: z.string(), to: z.string() })),
  reason: z.string().nullable(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

/** A member whose behaviour needs a look: blocked booking attempts and no-shows. */
export const flaggedMemberSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    status: accountStatusSchema,
  }),
  /** Bookings the server refused for the location rule (fake GPS, too far, wrong country). */
  blockedAttempts: z.number().int().min(0),
  noShows: z.number().int().min(0),
  /** The most recent flagged event, in words. */
  lastEvent: z.object({ at: isoDateTimeSchema, description: z.string() }).nullable(),
});
export type FlaggedMember = z.infer<typeof flaggedMemberSchema>;
