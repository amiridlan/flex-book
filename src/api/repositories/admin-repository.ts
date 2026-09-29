import { z } from 'zod';

import type { ApiClient } from '../client/api-client';
import {
  adminUserSchema,
  auditEventSchema,
  type AdminUser,
  type AuditEvent,
  type UpdateAccessInput,
} from '../schemas/admin';
import { resourceSchema } from '../schemas/common';

export type AdminRepository = {
  users(): Promise<readonly AdminUser[]>;
  updateAccess(userId: string, input: UpdateAccessInput): Promise<AdminUser>;
  auditTrail(): Promise<readonly AuditEvent[]>;
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
    async auditTrail() {
      return (
        await api.request('GET', '/admin/audit', z.object({ data: z.array(auditEventSchema) }))
      ).data;
    },
  };
}
