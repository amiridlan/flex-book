import { useQuery } from '@tanstack/react-query';

import { locationRepository } from '@/api';
import type { LocationFilters } from '@/api/repositories/location-repository';
import { queryKeys } from '@/lib/query-keys';

export function useLocations(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.locations.list(filters),
    queryFn: () => locationRepository.list(filters),
  });
}
