import type { z } from 'zod';

import { errorBodySchema } from '../schemas/common';
import { createApiError, kindFromStatus, type ApiError } from './api-error';
import type { HttpMethod, HttpTransport, QueryParams } from './transport';

export type ApiClientOptions = {
  readonly transport: HttpTransport;
  /** Returns the current bearer token, if signed in. */
  readonly getToken: () => string | null;
  /** Called on any 401 so the app can clear the session. */
  readonly onUnauthorized?: () => void;
};

type RequestOptions = {
  readonly query?: QueryParams;
  readonly body?: unknown;
};

export type ApiClient = {
  request<S extends z.ZodType>(
    method: HttpMethod,
    path: string,
    schema: S,
    options?: RequestOptions,
  ): Promise<z.infer<S>>;
  /** For endpoints that return 204 No Content. */
  send(method: HttpMethod, path: string, options?: RequestOptions): Promise<void>;
};

/**
 * The one place that turns HTTP into typed data or an ApiError. Every response
 * body is validated with Zod, so a backend contract change fails loudly here
 * instead of as `undefined` deep inside a screen.
 */
export function createApiClient({
  transport,
  getToken,
  onUnauthorized,
}: ApiClientOptions): ApiClient {
  async function perform(method: HttpMethod, path: string, options: RequestOptions) {
    const token = getToken();
    let response;
    try {
      response = await transport.send({
        method,
        path,
        query: options.query,
        body: options.body,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      throw createApiError(
        'network',
        null,
        'Could not reach the server. Check your connection and try again.',
      );
    }

    if (response.status >= 200 && response.status < 300) return response;

    if (response.status === 401) onUnauthorized?.();
    throw toApiError(response.status, response.body);
  }

  return {
    async request(method, path, schema, options = {}) {
      const response = await perform(method, path, options);
      const parsed = schema.safeParse(response.body);
      if (!parsed.success) {
        if (__DEV__) console.warn(`Invalid response for ${method} ${path}`, parsed.error.issues);
        throw createApiError(
          'invalid_response',
          response.status,
          'The server sent an unexpected response.',
        );
      }
      return parsed.data;
    },
    async send(method, path, options = {}) {
      await perform(method, path, options);
    },
  };
}

function toApiError(status: number, body: unknown): ApiError {
  const parsed = errorBodySchema.safeParse(body);
  const kind = kindFromStatus(status);
  const message = parsed.success ? parsed.data.message : defaultMessage(kind);
  const fieldErrors = parsed.success ? (parsed.data.errors ?? {}) : {};
  return createApiError(kind, status, message, fieldErrors);
}

function defaultMessage(kind: ApiError['kind']): string {
  switch (kind) {
    case 'unauthorized':
      return 'Your session has ended. Please sign in again.';
    case 'forbidden':
      return 'You do not have access to this.';
    case 'not_found':
      return 'We could not find that.';
    case 'validation':
      return 'Please check the highlighted fields.';
    default:
      return 'The server had a problem. Please try again.';
  }
}
