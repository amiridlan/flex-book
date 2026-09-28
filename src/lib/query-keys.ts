import type { LocationFilters } from '@/api/repositories/location-repository';

/** One place for cache keys, so invalidation never misses a spelling. */
export const queryKeys = {
  brands: ['brands'] as const,
  countries: ['countries'] as const,
  locations: {
    all: ['locations'] as const,
    list: (filters: LocationFilters) => ['locations', 'list', filters] as const,
    detail: (id: string) => ['locations', 'detail', id] as const,
  },
  availability: (spaceId: string, date: string) => ['availability', spaceId, date] as const,
};
