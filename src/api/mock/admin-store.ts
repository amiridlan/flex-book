import {
  accessProblem,
  describeAccess,
  needsAssignments,
  normaliseAssignments,
} from '@/domain/access';

import type { HttpResponse } from '../client/transport';
import type {
  AccountStatus,
  AdminUser,
  AuditAction,
  AuditEvent,
  UpdateAccessInput,
} from '../schemas/admin';
import type { User } from '../schemas/user';
import { BRANDS } from './db/brands';
import { LOCATIONS } from './db/locations';
import { PERMISSIONS_BY_ROLE, USERS } from './db/users';
import { json, validationError } from './router';

const NAMES = {
  brand: (id: string) => BRANDS.find((b) => b.id === id)?.name ?? id,
  location: (id: string) => LOCATIONS.find((l) => l.id === id)?.name ?? id,
};

type AuditInput = {
  readonly action: AuditAction;
  readonly target: AuditEvent['target'];
  readonly changes?: AuditEvent['changes'];
  readonly reason?: string | null;
};

/**
 * Users, account status and the audit trail for one mock server. The seed users
 * are copied in, so admin changes live only as long as this server (the page).
 * The real API keeps the same rules in Laravel policies and an audit table.
 */
export function createAdminStore(now: () => number) {
  const users = new Map<string, AdminUser>(USERS.map((u) => [u.id, { ...u, status: 'active' }]));
  const audit: AuditEvent[] = [];

  function record(actor: User, input: AuditInput) {
    audit.unshift({
      id: `evt_${audit.length + 1}`,
      at: new Date(now()).toISOString(),
      action: input.action,
      actor: { id: actor.id, name: actor.name },
      target: input.target,
      changes: input.changes ?? [],
      reason: input.reason ?? null,
    });
  }

  function publicUser({ status: _status, ...user }: AdminUser): User {
    return user;
  }

  return {
    record,

    findById(id: string): User | null {
      const user = users.get(id);
      return user ? publicUser(user) : null;
    },

    findByEmail(email: string): AdminUser | null {
      const wanted = email.toLowerCase();
      return [...users.values()].find((u) => u.email.toLowerCase() === wanted) ?? null;
    },

    statusOf(id: string): AccountStatus | null {
      return users.get(id)?.status ?? null;
    },

    list(): HttpResponse {
      const order = ['super_admin', 'group_admin', 'brand_admin', 'staff', 'member'];
      const list = [...users.values()].sort(
        (a, b) => order.indexOf(a.role) - order.indexOf(b.role) || a.name.localeCompare(b.name),
      );
      return json(200, { data: list });
    },

    /** Replaces a user's role and access. Takes effect on their next request. */
    updateAccess(actor: User, id: string, input: UpdateAccessInput): HttpResponse {
      const target = users.get(id);
      if (!target) return json(404, { message: 'User not found.' });
      if (target.id === actor.id) {
        return validationError({ role: ['You can’t change your own access.'] });
      }
      const assignments = needsAssignments(input.role)
        ? normaliseAssignments(input.assignments)
        : [];
      const problem = accessProblem(input.role, assignments);
      if (problem) return validationError({ assignments: [problem] });
      for (const a of assignments) {
        const location = a.locationId ? LOCATIONS.find((l) => l.id === a.locationId) : null;
        const brandKnown = BRANDS.some((b) => b.id === a.brandId);
        if (!brandKnown || (a.locationId && location?.brandId !== a.brandId)) {
          return validationError({ assignments: ['That brand or location does not exist.'] });
        }
      }
      const superAdmins = [...users.values()].filter((u) => u.role === 'super_admin');
      if (
        target.role === 'super_admin' &&
        input.role !== 'super_admin' &&
        superAdmins.length <= 1
      ) {
        return validationError({ role: ['Keep at least one super admin.'] });
      }

      const before = describeAccess(target.role, target.assignments, NAMES);
      const after = describeAccess(input.role, assignments, NAMES);
      const changes: AuditEvent['changes'] = [];
      if (target.role !== input.role) {
        changes.push({ field: 'role', from: target.role, to: input.role });
      }
      if (before !== after) changes.push({ field: 'access', from: before, to: after });
      if (changes.length === 0) return json(200, { data: target });

      const updated: AdminUser = {
        ...target,
        role: input.role,
        assignments,
        permissions: PERMISSIONS_BY_ROLE[input.role],
      };
      users.set(id, updated);
      record(actor, {
        action: 'access.updated',
        target: { type: 'user', id, label: target.name },
        changes,
      });
      return json(200, { data: updated });
    },

    auditTrail(): HttpResponse {
      return json(200, { data: audit });
    },
  };
}

export type AdminStore = ReturnType<typeof createAdminStore>;
