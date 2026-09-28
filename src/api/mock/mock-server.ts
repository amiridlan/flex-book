import { z } from 'zod';

import type { HttpRequest, HttpResponse, HttpTransport } from '../client/transport';
import {
  checkInSchema,
  createBookingSchema,
  staffCheckInSchema,
  walkInSchema,
} from '../schemas/booking';
import type { Location } from '../schemas/location';
import type { User } from '../schemas/user';
import { canSeeLocation } from './access';
import { buildAvailability } from './availability';
import { createBookingStore } from './booking-store';
import { BRANDS } from './db/brands';
import { COUNTRIES } from './db/countries';
import { LOCATIONS } from './db/locations';
import { SPACES } from './db/spaces';
import { DEMO_PASSWORD, USERS } from './db/users';
import { createRouter, json, noContent, validationError } from './router';

export type MockServerOptions = {
  /** Average simulated latency. Real latency varies ±50% around it. */
  readonly latencyMs: number;
  /** 0–1 chance that a request fails with a 500, to exercise error states. */
  readonly failureRate: number;
  readonly random?: () => number;
  /** Clock for availability; injectable so tests are deterministic. */
  readonly now?: () => number;
};

const loginBodySchema = z.object({
  email: z.string().trim().min(1, 'The email field is required.'),
  password: z.string().min(1, 'The password field is required.'),
});

const availabilityQuerySchema = z.object({
  date: z.iso.date({ error: 'The date field must be a valid date (YYYY-MM-DD).' }),
});

const listQuerySchema = z.object({
  country: z.string().optional(),
  brand: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * An in-process fake of the Laravel API. It speaks the same paths, status codes
 * and JSON shapes as the real backend, so swapping to EXPO_PUBLIC_API_MODE=http
 * changes nothing above the transport. DEMO ONLY: tokens are random strings
 * held in memory, not real authentication.
 */
export function createMockServer(options: MockServerOptions): HttpTransport {
  const random = options.random ?? Math.random;
  const now = options.now ?? Date.now;
  const sessions = new Map<string, string>(); // token -> user id
  const router = createRouter();
  const bookings = createBookingStore(random, now);
  bookings.seed(USERS.find((u) => u.role === 'member'));

  function currentUser(request: HttpRequest): User | null {
    const header = request.headers?.Authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const userId = sessions.get(token);
    return USERS.find((u) => u.id === userId) ?? null;
  }

  function authed(
    handler: (
      user: User,
      request: HttpRequest,
      params: Readonly<Record<string, string>>,
    ) => HttpResponse,
  ) {
    return ({
      request,
      params,
    }: {
      request: HttpRequest;
      params: Readonly<Record<string, string>>;
    }) => {
      const user = currentUser(request);
      if (!user) return json(401, { message: 'Unauthenticated.' });
      return handler(user, request, params);
    };
  }

  router.on('POST', '/auth/login', ({ request }) => {
    const body = loginBodySchema.safeParse(request.body);
    if (!body.success) return validationError(fieldErrors(body.error.issues));
    const user = USERS.find((u) => u.email.toLowerCase() === body.data.email.toLowerCase());
    if (!user || body.data.password !== DEMO_PASSWORD) {
      return validationError({ email: ['These credentials do not match our records.'] });
    }
    const token = `mock_${Math.floor(random() * 1e12).toString(36)}_${sessions.size}`;
    sessions.set(token, user.id);
    return json(200, { data: { token, user } });
  });

  router.on('POST', '/auth/logout', ({ request }) => {
    const header = request.headers?.Authorization ?? '';
    sessions.delete(header.replace(/^Bearer /, ''));
    return noContent();
  });

  router.on(
    'GET',
    '/me',
    authed((user) => json(200, { data: user })),
  );

  router.on(
    'GET',
    '/brands',
    authed(() => json(200, { data: BRANDS })),
  );

  router.on(
    'GET',
    '/countries',
    authed(() => json(200, { data: COUNTRIES })),
  );

  router.on(
    'GET',
    '/locations',
    authed((user, request) => {
      const query = listQuerySchema.safeParse(request.query ?? {});
      if (!query.success) return validationError({ query: ['Invalid filters.'] });
      const { country, brand, page, per_page } = query.data;
      const visible = LOCATIONS.filter(
        (l) =>
          canSeeLocation(user, l) &&
          (!country || l.countryCode === country) &&
          (!brand || l.brandId === brand),
      );
      return json(200, paginate(visible, page, per_page, '/locations'));
    }),
  );

  router.on(
    'GET',
    '/locations/:id',
    authed((user, _request, params) => {
      const location = LOCATIONS.find((l) => l.id === params.id);
      // Out-of-scope returns 404, not 403, so staff cannot probe for other brands' locations.
      if (!location || !canSeeLocation(user, location)) {
        return json(404, { message: 'Location not found.' });
      }
      const spaces = SPACES.filter((s) => s.locationId === location.id);
      return json(200, { data: { ...location, spaces } });
    }),
  );

  router.on(
    'GET',
    '/spaces/:id/availability',
    authed((user, request, params) => {
      const space = SPACES.find((s) => s.id === params.id);
      const location = LOCATIONS.find((l) => l.id === space?.locationId);
      if (!space || !location || !canSeeLocation(user, location)) {
        return json(404, { message: 'Space not found.' });
      }
      const query = availabilityQuerySchema.safeParse(request.query ?? {});
      if (!query.success) {
        return validationError({ date: [query.error.issues[0]?.message ?? 'Invalid date.'] });
      }
      return json(200, {
        data: buildAvailability(location, space, query.data.date, now(), bookings.ranges(space.id)),
      });
    }),
  );

  router.on(
    'POST',
    '/bookings',
    authed((user, request) => {
      if (!user.permissions.includes('bookings.create')) {
        return json(403, { message: 'This account cannot make bookings.' });
      }
      const body = createBookingSchema.safeParse(request.body);
      if (!body.success) return validationError(fieldErrors(body.error.issues));
      return bookings.create(user, body.data);
    }),
  );

  router.on(
    'GET',
    '/bookings',
    authed((user) => bookings.listFor(user)),
  );

  router.on(
    'GET',
    '/bookings/:id',
    authed((user, _request, params) => bookings.get(user, params.id ?? '')),
  );

  router.on(
    'PATCH',
    '/bookings/:id',
    authed((user, request, params) => {
      const body = z.object({ status: z.literal('cancelled') }).safeParse(request.body);
      if (!body.success) return validationError({ status: ['Only cancellation is supported.'] });
      return bookings.cancel(user, params.id ?? '');
    }),
  );

  router.on(
    'POST',
    '/bookings/:id/check-in',
    authed((user, request, params) => {
      const body = checkInSchema.safeParse(request.body);
      if (!body.success) return validationError(fieldErrors(body.error.issues));
      return bookings.checkIn(user, params.id ?? '', body.data.device);
    }),
  );

  /** Staff endpoints require `staff.dashboard`; scope is enforced per location in the store. */
  function staffOnly(
    handler: (
      user: User,
      request: HttpRequest,
      params: Readonly<Record<string, string>>,
    ) => HttpResponse,
  ) {
    return authed((user, request, params) =>
      user.permissions.includes('staff.dashboard')
        ? handler(user, request, params)
        : json(403, { message: 'Staff access only.' }),
    );
  }

  router.on(
    'GET',
    '/staff/locations/:id/bookings',
    staffOnly((user, request, params) => {
      const query = z.object({ date: z.iso.date().optional() }).safeParse(request.query ?? {});
      if (!query.success) return validationError({ date: ['Invalid date.'] });
      return bookings.staffList(user, params.id ?? '', query.data.date);
    }),
  );

  router.on(
    'POST',
    '/staff/check-ins',
    staffOnly((user, request) => {
      const body = staffCheckInSchema.safeParse(request.body);
      if (!body.success) return validationError({ code: ['Enter a code like FXB-7QLM.'] });
      return bookings.staffCheckIn(user, body.data);
    }),
  );

  router.on(
    'POST',
    '/staff/walk-ins',
    staffOnly((user, request) => {
      const body = walkInSchema.safeParse(request.body);
      if (!body.success) return validationError(fieldErrors(body.error.issues));
      return bookings.walkIn(user, body.data);
    }),
  );

  return {
    async send(request: HttpRequest): Promise<HttpResponse> {
      const jitter = 0.5 + random();
      await delay(options.latencyMs * jitter);
      if (options.failureRate > 0 && random() < options.failureRate) {
        return json(500, { message: 'Simulated server error. Please retry.' });
      }
      // JSON round-trip: callers can never mutate the fake database through a response,
      // and bodies are exactly what a real HTTP response would carry.
      const response = await router.handle(request);
      const body: unknown =
        response.body === null ? null : JSON.parse(JSON.stringify(response.body));
      return { status: response.status, body };
    },
  };
}

/** Zod issues -> Laravel-style `{ field: [messages] }`. */
function fieldErrors(issues: readonly z.core.$ZodIssue[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form');
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
}

function paginate(items: readonly Location[], page: number, perPage: number, path: string) {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const link = (p: number) => `${path}?page=${p}`;
  return {
    data: items.slice((page - 1) * perPage, page * perPage),
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total },
    links: {
      first: link(1),
      last: link(lastPage),
      prev: page > 1 ? link(page - 1) : null,
      next: page < lastPage ? link(page + 1) : null,
    },
  };
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
