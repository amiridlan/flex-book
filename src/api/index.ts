import { env } from '@/config/env';
import { useSessionStore } from '@/features/auth/session-store';

import { createApiClient } from './client/api-client';
import { createFetchTransport } from './client/fetch-transport';
import type { HttpTransport } from './client/transport';
import { createMockServer } from './mock/mock-server';
import { createAuthRepository } from './repositories/auth-repository';
import { createBookingRepository } from './repositories/booking-repository';
import { createCatalogRepository } from './repositories/catalog-repository';
import { createLocationRepository } from './repositories/location-repository';
import { createSpaceRepository } from './repositories/space-repository';

function createTransport(): HttpTransport {
  if (env.apiMode === 'http' && env.apiBaseUrl) return createFetchTransport(env.apiBaseUrl);
  return createMockServer({ latencyMs: env.mockLatencyMs, failureRate: env.mockFailureRate });
}

/** The single ApiClient. Swapping mock for the Laravel API is the transport line above. */
export const apiClient = createApiClient({
  transport: createTransport(),
  getToken: () => useSessionStore.getState().token,
  onUnauthorized: () => useSessionStore.getState().signOut(),
});

export const authRepository = createAuthRepository(apiClient);
export const catalogRepository = createCatalogRepository(apiClient);
export const locationRepository = createLocationRepository(apiClient);
export const spaceRepository = createSpaceRepository(apiClient);
export const bookingRepository = createBookingRepository(apiClient);
