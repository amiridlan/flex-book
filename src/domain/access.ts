import type { Assignment, Role } from '@/api/schemas/user';

/** Roles that work at named brands or locations; the others need no assignments. */
export const ASSIGNED_ROLES: readonly Role[] = ['staff', 'brand_admin'];

export function needsAssignments(role: Role): boolean {
  return ASSIGNED_ROLES.includes(role);
}

/**
 * Tidies a set of assignments: drops duplicates, and drops single locations of a
 * brand that is already assigned whole. Sorted so equal access compares equal.
 */
export function normaliseAssignments(assignments: readonly Assignment[]): Assignment[] {
  const wholeBrands = new Set(
    assignments.filter((a) => a.locationId === null).map((a) => a.brandId),
  );
  const seen = new Set<string>();
  const result: Assignment[] = [];
  for (const a of assignments) {
    if (a.locationId !== null && wholeBrands.has(a.brandId)) continue;
    const key = `${a.brandId}/${a.locationId ?? '*'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ brandId: a.brandId, locationId: a.locationId });
  }
  return result.sort((x, y) =>
    `${x.brandId}/${x.locationId ?? ''}`.localeCompare(`${y.brandId}/${y.locationId ?? ''}`),
  );
}

/** Why a role and access pair is not allowed, or null when it is. Shared by the app and the server. */
export function accessProblem(role: Role, assignments: readonly Assignment[]): string | null {
  if (!needsAssignments(role)) return null;
  if (assignments.length === 0) return 'Give them at least one brand or location.';
  if (role === 'brand_admin' && assignments.some((a) => a.locationId !== null)) {
    return 'A brand admin covers whole brands. Choose "All locations" for each brand.';
  }
  return null;
}

type NameLookup = {
  readonly brand: (id: string) => string;
  readonly location: (id: string) => string;
};

/** One line for lists and the audit trail, e.g. "Hive · all locations; Clustered · Straits Quay House". */
export function describeAccess(
  role: Role,
  assignments: readonly Assignment[],
  names: NameLookup,
): string {
  if (role === 'member') return 'Books at every brand';
  if (!needsAssignments(role)) return 'All brands and locations';
  if (assignments.length === 0) return 'No access';
  return normaliseAssignments(assignments)
    .map((a) =>
      a.locationId === null
        ? `${names.brand(a.brandId)} · all locations`
        : `${names.brand(a.brandId)} · ${names.location(a.locationId)}`,
    )
    .join('; ');
}
