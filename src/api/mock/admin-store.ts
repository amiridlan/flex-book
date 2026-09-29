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
  InviteStaffInput,
  UpdateAccessInput,
  UpdateStatusInput,
} from '../schemas/admin';
import type { User } from '../schemas/user';
import { BRANDS } from './db/brands';
import { LOCATIONS } from './db/locations';
import { PERMISSIONS_BY_ROLE, USERS } from './db/users';
import { json, validationError } from './router';

/** Seeded as suspended, so the People list and the log show what a suspension looks like. */
const SEED_SUSPENDED = new Set(['usr_member_suspended']);

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
  const users = new Map<string, AdminUser>(
    USERS.map((u) => [u.id, { ...u, status: SEED_SUSPENDED.has(u.id) ? 'suspended' : 'active' }]),
  );
  const audit: AuditEvent[] = [];
  let invited = 0;

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

  // The seeded suspension, logged two days ago by the super admin.
  const seededBy = USERS.find((u) => u.role === 'super_admin');
  const seededTarget = USERS.find((u) => SEED_SUSPENDED.has(u.id));
  if (seededBy && seededTarget) {
    audit.push({
      id: 'evt_seed_1',
      at: new Date(now() - 2 * 86_400_000).toISOString(),
      action: 'account.suspended',
      actor: { id: seededBy.id, name: seededBy.name },
      target: { type: 'user', id: seededTarget.id, label: seededTarget.name },
      changes: [{ field: 'status', from: 'active', to: 'suspended' }],
      reason: 'Three booking attempts from a fake-GPS app in one week.',
    });
  }

  function findByEmail(email: string): AdminUser | null {
    const wanted = email.toLowerCase();
    return [...users.values()].find((u) => u.email.toLowerCase() === wanted) ?? null;
  }

  function publicUser({ status: _status, ...user }: AdminUser): User {
    return user;
  }

  return {
    record,

    /** The account behind a session; a suspended account counts as signed out. */
    findById(id: string): User | null {
      const user = users.get(id);
      return user && user.status === 'active' ? publicUser(user) : null;
    },

    findByEmail,

    /** The full account record (with status), for admin views. */
    account(id: string): AdminUser | null {
      return users.get(id) ?? null;
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

    /** Suspends (signs out and blocks sign-in) or reactivates an account. */
    setStatus(actor: User, id: string, input: UpdateStatusInput): HttpResponse {
      const target = users.get(id);
      if (!target) return json(404, { message: 'User not found.' });
      if (target.id === actor.id) {
        return validationError({ status: ['You can’t suspend your own account.'] });
      }
      if (target.status === input.status) return json(200, { data: target });
      const updated: AdminUser = { ...target, status: input.status };
      users.set(id, updated);
      record(actor, {
        action: input.status === 'suspended' ? 'account.suspended' : 'account.reactivated',
        target: { type: 'user', id, label: target.name },
        changes: [{ field: 'status', from: target.status, to: input.status }],
        reason: input.reason,
      });
      return json(200, { data: updated });
    },

    /** Creates a staff account. The real API emails an invite link; the demo has none. */
    invite(actor: User, input: InviteStaffInput): HttpResponse {
      if (findByEmail(input.email)) {
        return validationError({ email: ['Someone already uses this email.'] });
      }
      const assignments = needsAssignments(input.role)
        ? normaliseAssignments(input.assignments)
        : [];
      const problem = accessProblem(input.role, assignments);
      if (problem) return validationError({ assignments: [problem] });
      invited += 1;
      const user: AdminUser = {
        id: `usr_invited_${invited}`,
        name: input.name.trim(),
        email: input.email.toLowerCase(),
        role: input.role,
        assignments,
        permissions: PERMISSIONS_BY_ROLE[input.role],
        status: 'active',
      };
      users.set(user.id, user);
      record(actor, {
        action: 'staff.invited',
        target: { type: 'user', id: user.id, label: user.name },
        changes: [
          { field: 'role', from: '—', to: user.role },
          { field: 'access', from: '—', to: describeAccess(user.role, assignments, NAMES) },
        ],
      });
      return json(201, { data: user });
    },

    auditTrail(): HttpResponse {
      return json(200, { data: audit });
    },
  };
}

export type AdminStore = ReturnType<typeof createAdminStore>;
