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
  availabilityForSpace: (spaceId: string) => ['availability', spaceId] as const,
  bookings: {
    all: ['bookings'] as const,
    mine: ['bookings', 'mine'] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
  admin: {
    all: ['admin'] as const,
    users: ['admin', 'users'] as const,
    audit: ['admin', 'audit'] as const,
    flags: ['admin', 'flags'] as const,
  },
  staff: {
    all: ['staff'] as const,
    bookings: (locationId: string) => ['staff', 'bookings', locationId] as const,
  },
};
