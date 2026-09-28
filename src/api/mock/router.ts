import type { HttpMethod, HttpRequest, HttpResponse } from '../client/transport';

export type RouteContext = {
  readonly request: HttpRequest;
  readonly params: Readonly<Record<string, string>>;
};

export type RouteHandler = (context: RouteContext) => HttpResponse | Promise<HttpResponse>;

type Route = {
  readonly method: HttpMethod;
  readonly pattern: RegExp;
  readonly keys: readonly string[];
  readonly handler: RouteHandler;
};

/** Minimal path router: `/locations/:id` style patterns. */
export function createRouter() {
  const routes: Route[] = [];

  return {
    on(method: HttpMethod, path: string, handler: RouteHandler) {
      const keys: string[] = [];
      const source = path.replace(/:([a-zA-Z]+)/g, (_match, key: string) => {
        keys.push(key);
        return '([^/]+)';
      });
      routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler });
    },
    async handle(request: HttpRequest): Promise<HttpResponse> {
      for (const route of routes) {
        if (route.method !== request.method) continue;
        const match = route.pattern.exec(request.path);
        if (!match) continue;
        const params: Record<string, string> = {};
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1] ?? '');
        });
        return route.handler({ request, params });
      }
      return json(404, { message: `Route ${request.method} ${request.path} not found.` });
    },
  };
}

export function json(status: number, body: unknown): HttpResponse {
  return { status, body };
}

export function noContent(): HttpResponse {
  return { status: 204, body: null };
}

export function validationError(errors: Readonly<Record<string, readonly string[]>>): HttpResponse {
  const first = Object.values(errors)[0]?.[0] ?? 'The given data was invalid.';
  return json(422, { message: first, errors });
}
