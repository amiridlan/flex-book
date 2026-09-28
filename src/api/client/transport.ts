export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type QueryParams = Readonly<Record<string, string | number | boolean | undefined>>;

export type HttpRequest = {
  readonly method: HttpMethod;
  /** Path relative to the API base, e.g. `/locations/loc_tcg_kul`. */
  readonly path: string;
  readonly query?: QueryParams;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
};

export type HttpResponse = {
  readonly status: number;
  /** Parsed JSON body, or null when the response has none. */
  readonly body: unknown;
};

/**
 * Moves a request to a server and back. The real implementation uses fetch; the
 * mock implementation is an in-process fake of the Laravel API. Neither parses or
 * interprets the body: that is ApiClient's job, so both behave identically.
 * Transports reject only for network failures.
 */
export type HttpTransport = {
  send(request: HttpRequest): Promise<HttpResponse>;
};
