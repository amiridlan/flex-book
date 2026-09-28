import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@/api/client/api-error';

/** Errors that will fail the same way on retry, so retrying only delays the message. */
const PERMANENT = new Set([
  'unauthorized',
  'forbidden',
  'not_found',
  'validation',
  'invalid_response',
]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && PERMANENT.has(error.kind)) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();
