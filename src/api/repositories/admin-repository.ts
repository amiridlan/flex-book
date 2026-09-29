import { z } from 'zod';

import type { ApiClient } from '../client/api-client';
import {
  adminUserSchema,
  auditEventSchema,
  flaggedMemberSchema,
  type AdminUser,
  type AuditEvent,
  type FlaggedMember,
  type InviteStaffInput,
  type OverrideBookingInput,
  type UpdateAccessInput,
  type UpdateStatusInput,
} from '../schemas/admin';
import { staffBookingSchema, type StaffBooking } from '../schemas/booking';
import { resourceSchema } from '../schemas/common';

export type AdminRepository = {
  users(): Promise<readonly AdminUser[]>;
  updateAccess(userId: string, input: UpdateAccessInput): Promise<AdminUser>;
  setStatus(userId: string, input: UpdateStatusInput): Promise<AdminUser>;
  invite(input: InviteStaffInput): Promise<AdminUser>;
  auditTrail(): Promise<readonly AuditEvent[]>;
  flagged(): Promise<readonly FlaggedMember[]>;
  overrideBooking(bookingId: string, input: OverrideBookingInput): Promise<StaffBooking>;
};

/** Super admin endpoints. The server checks the permission on every call. */
export function createAdminRepository(api: ApiClient): AdminRepository {
  return {
    async users() {
      return (
        await api.request('GET', '/admin/users', z.object({ data: z.array(adminUserSchema) }))
      ).data;
    },
    async updateAccess(userId, input) {
      return (
        await api.request(
          'PATCH',
          `/admin/users/${encodeURIComponent(userId)}/access`,
          resourceSchema(adminUserSchema),
          { body: input },
        )
      ).data;
    },
    async setStatus(userId, input) {
      return (
        await api.request(
          'PATCH',
          `/admin/users/${encodeURIComponent(userId)}/status`,
          resourceSchema(adminUserSchema),
          { body: input },
        )
      ).data;
    },
    async invite(input) {
      return (
        await api.request('POST', '/admin/users', resourceSchema(adminUserSchema), { body: input })
      ).data;
    },
    async overrideBooking(bookingId, input) {
      return (
        await api.request(
          'POST',
          `/admin/bookings/${encodeURIComponent(bookingId)}/override`,
          resourceSchema(staffBookingSchema),
          { body: input },
        )
      ).data;
    },
    async flagged() {
      return (
        await api.request('GET', '/admin/flags', z.object({ data: z.array(flaggedMemberSchema) }))
      ).data;
    },
    async auditTrail() {
      return (
        await api.request('GET', '/admin/audit', z.object({ data: z.array(auditEventSchema) }))
      ).data;
    },
  };
}
