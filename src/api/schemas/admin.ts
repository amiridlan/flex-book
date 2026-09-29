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
