import { useQuery } from '@tanstack/react-query';

import { locationRepository, spaceRepository } from '@/api';
import type { LocationFilters } from '@/api/repositories/location-repository';
import { queryKeys } from '@/lib/query-keys';

export function useLocations(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.locations.list(filters),
    queryFn: () => locationRepository.list(filters),
  });
}

export function useLocation(id: string, options: { readonly enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.locations.detail(id),
    queryFn: () => locationRepository.get(id),
    enabled: options.enabled ?? true,
  });
}

/** Availability goes stale fast: refetch on every visit. */
export function useAvailability(spaceId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.availability(spaceId, date),
    queryFn: () => spaceRepository.availability(spaceId, date),
    // Forms render this before a space is chosen; don't request `/spaces//availability`.
    enabled: spaceId !== '' && date !== '',
    staleTime: 0,
  });
}
