import type { Location } from '@/api/schemas/location';
import { useLocations } from '@/features/locations/use-locations';

import { useStaffLocationStore } from './staff-location-store';

/**
 * The staff member's working location. The list comes from the API, which only
 * returns locations in their scope; defaults to the first one.
 */
export function useStaffLocation() {
  const locations = useLocations();
  const selectedId = useStaffLocationStore((s) => s.locationId);
  const setLocationId = useStaffLocationStore((s) => s.setLocationId);

  const all: readonly Location[] = locations.data?.data ?? [];
  const current = all.find((l) => l.id === selectedId) ?? all[0];

  return { locations, all, current, setLocationId };
}
