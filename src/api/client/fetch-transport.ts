import type { HttpRequest, HttpResponse, HttpTransport } from './transport';

export function buildUrl(baseUrl: string, request: HttpRequest): string {
  const url = new URL(baseUrl.replace(/\/$/, '') + request.path);
  for (const [key, value] of Object.entries(request.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Talks to the real Laravel API. Used when EXPO_PUBLIC_API_MODE=http. */
export function createFetchTransport(baseUrl: string, timeoutMs = 15_000): HttpTransport {
  return {
    async send(request: HttpRequest): Promise<HttpResponse> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(buildUrl(baseUrl, request), {
          method: request.method,
          headers: {
            Accept: 'application/json',
            ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...request.headers,
          },
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: controller.signal,
        });
        const text = await response.text();
        let body: unknown = null;
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = null; // Non-JSON body (e.g. an HTML error page): ApiClient reports it.
          }
        }
        return { status: response.status, body };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
