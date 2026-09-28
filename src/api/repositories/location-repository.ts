import type { ApiClient } from '../client/api-client';
import type { BrandId } from '../schemas/brand';
import {
  paginatedSchema,
  resourceSchema,
  type CountryCode,
  type Paginated,
} from '../schemas/common';
import {
  locationDetailSchema,
  locationSchema,
  type Location,
  type LocationDetail,
} from '../schemas/location';

export type LocationFilters = {
  readonly country?: CountryCode;
  readonly brand?: BrandId;
  readonly page?: number;
};

export type LocationRepository = {
  list(filters?: LocationFilters): Promise<Paginated<Location>>;
  get(id: string): Promise<LocationDetail>;
};

export function createLocationRepository(api: ApiClient): LocationRepository {
  return {
    list: (filters = {}) =>
      api.request('GET', '/locations', paginatedSchema(locationSchema), {
        query: { country: filters.country, brand: filters.brand, page: filters.page },
      }),
    async get(id) {
      const response = await api.request(
        'GET',
        `/locations/${encodeURIComponent(id)}`,
        resourceSchema(locationDetailSchema),
      );
      return response.data;
    },
  };
}
