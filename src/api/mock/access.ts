import type { Location } from '../schemas/location';
import type { User } from '../schemas/user';

/**
 * Server-side visibility rule, mirrored from what the Laravel policy / global
 * scope will do. Members, group admins and super admins see every location; staff and brand
 * admins only see locations covered by their assignments. This runs in the
 * (mock) server, never trusted to the UI.
 */
export function canSeeLocation(user: User, location: Location): boolean {
  if (user.role === 'member' || user.role === 'group_admin' || user.role === 'super_admin') {
    return true;
  }
  return user.assignments.some(
    (a) =>
      a.brandId === location.brandId && (a.locationId === null || a.locationId === location.id),
  );
}
