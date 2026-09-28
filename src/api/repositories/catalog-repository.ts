import { z } from 'zod';

import type { ApiClient } from '../client/api-client';
import { brandSchema, type Brand } from '../schemas/brand';
import { countrySchema, type Country } from '../schemas/country';

export type CatalogRepository = {
  brands(): Promise<readonly Brand[]>;
  countries(): Promise<readonly Country[]>;
};

export function createCatalogRepository(api: ApiClient): CatalogRepository {
  return {
    async brands() {
      const response = await api.request(
        'GET',
        '/brands',
        z.object({ data: z.array(brandSchema) }),
      );
      return response.data;
    },
    async countries() {
      const response = await api.request(
        'GET',
        '/countries',
        z.object({ data: z.array(countrySchema) }),
      );
      return response.data;
    },
  };
}
