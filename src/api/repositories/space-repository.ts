import type { ApiClient } from '../client/api-client';
import { availabilitySchema, type Availability } from '../schemas/availability';
import { resourceSchema } from '../schemas/common';

export type SpaceRepository = {
  /** `date` is a calendar day in the location's timezone, `yyyy-MM-dd`. */
  availability(spaceId: string, date: string): Promise<Availability>;
};

export function createSpaceRepository(api: ApiClient): SpaceRepository {
  return {
    async availability(spaceId, date) {
      const response = await api.request(
        'GET',
        `/spaces/${encodeURIComponent(spaceId)}/availability`,
        resourceSchema(availabilitySchema),
        { query: { date } },
      );
      return response.data;
    },
  };
}
