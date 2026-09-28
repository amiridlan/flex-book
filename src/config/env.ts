import { z } from 'zod';

const envSchema = z.object({
  apiMode: z.enum(['mock', 'http']).default('mock'),
  apiBaseUrl: z.url().optional(),
  mockLatencyMs: z.coerce.number().int().min(0).max(10_000).default(400),
  mockFailureRate: z.coerce.number().min(0).max(1).default(0),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Reads build-time config. `EXPO_PUBLIC_*` values are inlined into the bundle and
 * are therefore public: never put secrets here. Each variable must be read with a
 * static `process.env.EXPO_PUBLIC_X` expression or Expo will not inline it.
 */
export function readEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    apiMode: process.env.EXPO_PUBLIC_API_MODE || undefined,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || undefined,
    mockLatencyMs: process.env.EXPO_PUBLIC_MOCK_LATENCY_MS || undefined,
    mockFailureRate: process.env.EXPO_PUBLIC_MOCK_FAILURE_RATE || undefined,
  });
  if (!parsed.success) {
    throw new Error(`Invalid app environment: ${z.prettifyError(parsed.error)}`);
  }
  if (parsed.data.apiMode === 'http' && !parsed.data.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is required when EXPO_PUBLIC_API_MODE=http');
  }
  return parsed.data;
}

export const env = readEnv();
