import { z } from 'zod';

import {
  adminUserSchema,
  auditEventSchema,
  flaggedMemberSchema,
  inviteStaffSchema,
  locationSettingsSchema,
  overrideBookingSchema,
  updateAccessSchema,
  updateLocationSettingsSchema,
  updateSpaceSettingsSchema,
  updateStatusSchema,
} from './schemas/admin';
import { availabilitySchema } from './schemas/availability';
import {
  bookingSchema,
  checkInSchema,
  createBookingSchema,
  staffBookingSchema,
  staffCheckInSchema,
  walkInSchema,
} from './schemas/booking';
import { brandSchema } from './schemas/brand';
import { errorBodySchema } from './schemas/common';
import { countrySchema } from './schemas/country';
import { locationDetailSchema, locationSchema } from './schemas/location';
import { userSchema } from './schemas/user';

/**
 * The OpenAPI 3.0 contract for the Laravel team, generated from the same Zod
 * schemas the app validates responses with, so the spec cannot drift from the
 * code. `npm run openapi` rewrites docs/openapi.json; a test fails when stale.
 */
const COMPONENTS = {
  Brand: brandSchema,
  Country: countrySchema,
  Location: locationSchema,
  LocationDetail: locationDetailSchema,
  Availability: availabilitySchema,
  Booking: bookingSchema,
  StaffBooking: staffBookingSchema,
  User: userSchema,
  AdminUser: adminUserSchema,
  AuditEvent: auditEventSchema,
  UpdateAccessRequest: updateAccessSchema,
  UpdateStatusRequest: updateStatusSchema,
  InviteStaffRequest: inviteStaffSchema,
  FlaggedMember: flaggedMemberSchema,
  OverrideBookingRequest: overrideBookingSchema,
  LocationSettings: locationSettingsSchema,
  UpdateLocationSettingsRequest: updateLocationSettingsSchema,
  UpdateSpaceSettingsRequest: updateSpaceSettingsSchema,
  CreateBookingRequest: createBookingSchema,
  CheckInRequest: checkInSchema,
  StaffCheckInRequest: staffCheckInSchema,
  WalkInRequest: walkInSchema,
  LoginRequest: z.object({ email: z.email(), password: z.string() }),
  Error: errorBodySchema,
} as const;

type ComponentName = keyof typeof COMPONENTS;

type Endpoint = {
  readonly method: 'get' | 'post' | 'patch';
  readonly path: string;
  /** Stable name for generated clients (e.g. a PHP or TS SDK). */
  readonly operationId: string;
  readonly summary: string;
  readonly tag: string;
  readonly auth?: boolean;
  readonly query?: readonly { name: string; required: boolean; description: string }[];
  readonly body?: ComponentName | 'CancelRequest';
  /** Response `data` shape: a component, or a list of one. */
  readonly data?: ComponentName | readonly [ComponentName];
  readonly paginated?: boolean;
  readonly status?: 200 | 201 | 204;
  readonly errors: readonly (401 | 403 | 404 | 422)[];
};

const ENDPOINTS: readonly Endpoint[] = [
  {
    method: 'post',
    path: '/auth/login',
    operationId: 'login',
    summary: 'Sign in (Sanctum token)',
    tag: 'Auth',
    auth: false,
    body: 'LoginRequest',
    errors: [422],
  },
  {
    method: 'post',
    path: '/auth/logout',
    operationId: 'logout',
    summary: 'Revoke the current token',
    tag: 'Auth',
    status: 204,
    errors: [401],
  },
  {
    method: 'get',
    path: '/me',
    operationId: 'getMe',
    summary: 'Current user, role, scope and permissions',
    tag: 'Auth',
    data: 'User',
    errors: [401],
  },
  {
    method: 'get',
    path: '/brands',
    operationId: 'listBrands',
    summary: 'All brands and their themes',
    tag: 'Catalog',
    data: ['Brand'],
    errors: [401],
  },
  {
    method: 'get',
    path: '/countries',
    operationId: 'listCountries',
    summary: 'Markets with currency and tax',
    tag: 'Catalog',
    data: ['Country'],
    errors: [401],
  },
  {
    method: 'get',
    path: '/locations',
    operationId: 'listLocations',
    summary: 'Locations visible to the user (staff: own scope only)',
    tag: 'Locations',
    data: ['Location'],
    paginated: true,
    errors: [401, 422],
    query: [
      { name: 'country', required: false, description: 'ISO country code, e.g. MY' },
      { name: 'brand', required: false, description: 'Brand id, e.g. hive' },
      { name: 'page', required: false, description: 'Page number' },
    ],
  },
  {
    method: 'get',
    path: '/locations/{id}',
    operationId: 'getLocation',
    summary: 'Location with its spaces (404 outside staff scope)',
    tag: 'Locations',
    data: 'LocationDetail',
    errors: [401, 404],
  },
  {
    method: 'get',
    path: '/spaces/{id}/availability',
    operationId: 'getSpaceAvailability',
    summary: 'Slots for a local date, in UTC',
    tag: 'Locations',
    data: 'Availability',
    errors: [401, 404, 422],
    query: [
      { name: 'date', required: true, description: 'Date in the location timezone, YYYY-MM-DD' },
    ],
  },
  {
    method: 'post',
    path: '/bookings',
    operationId: 'createBooking',
    summary: 'Book a slot. Re-checks the distance rule server-side',
    tag: 'Bookings',
    body: 'CreateBookingRequest',
    data: 'Booking',
    status: 201,
    errors: [401, 403, 422],
  },
  {
    method: 'get',
    path: '/bookings',
    operationId: 'listMyBookings',
    summary: 'The member’s bookings',
    tag: 'Bookings',
    data: ['Booking'],
    errors: [401],
  },
  {
    method: 'get',
    path: '/bookings/{id}',
    operationId: 'getBooking',
    summary: 'One of the member’s bookings',
    tag: 'Bookings',
    data: 'Booking',
    errors: [401, 404],
  },
  {
    method: 'patch',
    path: '/bookings/{id}',
    operationId: 'cancelBooking',
    summary: 'Cancel (free until 60 minutes before start)',
    tag: 'Bookings',
    body: 'CancelRequest',
    data: 'Booking',
    errors: [401, 404, 422],
  },
  {
    method: 'post',
    path: '/bookings/{id}/check-in',
    operationId: 'checkInBooking',
    summary: 'Member self check-in on site',
    tag: 'Bookings',
    body: 'CheckInRequest',
    data: 'Booking',
    errors: [401, 404, 422],
  },
  {
    method: 'get',
    path: '/staff/locations/{id}/bookings',
    operationId: 'listStaffBookings',
    summary: 'Staff board for a location and local date',
    tag: 'Staff',
    data: ['StaffBooking'],
    errors: [401, 403, 404],
    query: [
      {
        name: 'date',
        required: false,
        description: 'YYYY-MM-DD, defaults to today at the location',
      },
    ],
  },
  {
    method: 'get',
    path: '/staff/bookings',
    operationId: 'listAllStaffBookings',
    summary: 'Today at every location in scope, one board (brand admin and up)',
    tag: 'Staff',
    data: ['StaffBooking'],
    errors: [401, 403],
  },
  {
    method: 'post',
    path: '/staff/check-ins',
    operationId: 'staffCheckIn',
    summary: 'Front-desk check-in by QR token or booking code',
    tag: 'Staff',
    body: 'StaffCheckInRequest',
    data: 'StaffBooking',
    errors: [401, 403, 404, 422],
  },
  {
    method: 'post',
    path: '/staff/walk-ins',
    operationId: 'createWalkIn',
    summary: 'Book and check in a walk-in guest for today',
    tag: 'Staff',
    body: 'WalkInRequest',
    data: 'StaffBooking',
    status: 201,
    errors: [401, 403, 422],
  },
  {
    method: 'get',
    path: '/admin/users',
    operationId: 'listUsers',
    summary: 'Every account with its role, access and status (super admin)',
    tag: 'Admin',
    data: ['AdminUser'],
    errors: [401, 403],
  },
  {
    method: 'patch',
    path: '/admin/users/{id}/access',
    operationId: 'updateUserAccess',
    summary: 'Replace a user’s role and brand/location access (super admin)',
    tag: 'Admin',
    body: 'UpdateAccessRequest',
    data: 'AdminUser',
    errors: [401, 403, 404, 422],
  },
  {
    method: 'patch',
    path: '/admin/users/{id}/status',
    operationId: 'updateUserStatus',
    summary: 'Suspend or reactivate an account, with a reason (super admin)',
    tag: 'Admin',
    body: 'UpdateStatusRequest',
    data: 'AdminUser',
    errors: [401, 403, 404, 422],
  },
  {
    method: 'post',
    path: '/admin/users',
    operationId: 'inviteStaff',
    summary: 'Create a staff account with a role and access (super admin)',
    tag: 'Admin',
    body: 'InviteStaffRequest',
    data: 'AdminUser',
    status: 201,
    errors: [401, 403, 422],
  },
  {
    method: 'post',
    path: '/admin/bookings/{id}/override',
    operationId: 'overrideBooking',
    summary: 'Cancel or manually check in any booking, with a reason (super admin)',
    tag: 'Admin',
    body: 'OverrideBookingRequest',
    data: 'StaffBooking',
    errors: [401, 403, 404, 422],
  },
  {
    method: 'get',
    path: '/admin/locations',
    operationId: 'listLocationSettings',
    summary: 'Every location with closures and booking rules (super admin)',
    tag: 'Admin',
    data: ['LocationSettings'],
    errors: [401, 403],
  },
  {
    method: 'patch',
    path: '/admin/locations/{id}',
    operationId: 'updateLocationSettings',
    summary: 'Close or reopen a location, or change its booking rules (super admin)',
    tag: 'Admin',
    body: 'UpdateLocationSettingsRequest',
    data: 'LocationSettings',
    errors: [401, 403, 404, 422],
  },
  {
    method: 'patch',
    path: '/admin/spaces/{id}',
    operationId: 'updateSpaceSettings',
    summary: 'Close or reopen one space (super admin)',
    tag: 'Admin',
    body: 'UpdateSpaceSettingsRequest',
    data: 'LocationSettings',
    errors: [401, 403, 404, 422],
  },
  {
    method: 'get',
    path: '/admin/flags',
    operationId: 'listFlaggedMembers',
    summary: 'Members with blocked booking attempts or no-shows, worst first (super admin)',
    tag: 'Admin',
    data: ['FlaggedMember'],
    errors: [401, 403],
  },
  {
    method: 'get',
    path: '/admin/audit',
    operationId: 'listAuditEvents',
    summary: 'Audit trail of admin actions, newest first (super admin)',
    tag: 'Admin',
    data: ['AuditEvent'],
    errors: [401, 403],
  },
];

const ERROR_TEXT: Readonly<Record<number, string>> = {
  401: 'Unauthenticated',
  403: 'Missing permission',
  404: 'Not found, or outside the caller’s scope',
  422: 'Validation failed (Laravel format: message + errors per field)',
};

const SAFE = Number.MAX_SAFE_INTEGER;

function componentSchemas() {
  const registry = z.registry<{ id: string }>();
  for (const [id, schema] of Object.entries(COMPONENTS)) registry.add(schema, { id });
  const { schemas } = z.toJSONSchema(registry, {
    target: 'openapi-3.0',
    uri: (id) => `#/components/schemas/${id}`,
    override: ({ jsonSchema }) => {
      const s = jsonSchema as Record<string, unknown>;
      // Keep the spec readable: formats already say what regexes spell out.
      if (typeof s.format === 'string') delete s.pattern;
      if (s.minimum === -SAFE) delete s.minimum;
      if (s.maximum === SAFE) delete s.maximum;
      delete s.readOnly;
    },
  });
  for (const schema of Object.values(schemas)) delete (schema as Record<string, unknown>).$id;
  return schemas;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

function responseBody(endpoint: Endpoint) {
  if (!endpoint.data) return ref('LoginResponse');
  const item =
    typeof endpoint.data === 'string'
      ? ref(endpoint.data)
      : { type: 'array', items: ref(endpoint.data[0]) };
  if (!endpoint.paginated)
    return { type: 'object', required: ['data'], properties: { data: item } };
  return {
    type: 'object',
    required: ['data', 'meta', 'links'],
    properties: { data: item, meta: ref('PaginationMeta'), links: ref('PaginationLinks') },
  };
}

export function buildOpenApiDocument() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const e of ENDPOINTS) {
    const params = [
      ...(e.path.includes('{id}')
        ? [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
        : []),
      ...(e.query ?? []).map((q) => ({
        name: q.name,
        in: 'query',
        required: q.required,
        description: q.description,
        schema: { type: 'string' },
      })),
    ];
    const status = e.status ?? 200;
    paths[e.path] ??= {};
    paths[e.path]![e.method] = {
      operationId: e.operationId,
      tags: [e.tag],
      summary: e.summary,
      ...(e.auth === false ? { security: [] } : {}),
      ...(params.length ? { parameters: params } : {}),
      ...(e.body
        ? {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: ref(e.body) } },
            },
          }
        : {}),
      responses: {
        [status]:
          status === 204
            ? { description: 'No content' }
            : { description: 'OK', content: { 'application/json': { schema: responseBody(e) } } },
        ...Object.fromEntries(
          e.errors.map((code) => [
            code,
            {
              description: ERROR_TEXT[code],
              content: { 'application/json': { schema: ref('Error') } },
            },
          ]),
        ),
      },
    };
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'FlexiSpace API',
      version: '1.0.0',
      description:
        'Contract between the FlexiSpace app and the Laravel 12 backend. Times are UTC ISO 8601; money is integer minor units plus ISO 4217 currency. Generated from src/api/schemas — do not edit by hand.',
    },
    servers: [{ url: 'https://api.example.com/api/v1', description: 'Placeholder' }],
    security: [{ sanctum: [] }],
    paths,
    components: {
      securitySchemes: {
        sanctum: {
          type: 'http',
          scheme: 'bearer',
          description: 'Laravel Sanctum personal access token',
        },
      },
      schemas: {
        ...componentSchemas(),
        CancelRequest: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['cancelled'] } },
        },
        LoginResponse: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['token', 'user'],
              properties: { token: { type: 'string' }, user: ref('User') },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          required: ['current_page', 'last_page', 'per_page', 'total'],
          properties: Object.fromEntries(
            ['current_page', 'last_page', 'per_page', 'total'].map((k) => [k, { type: 'integer' }]),
          ),
        },
        PaginationLinks: {
          type: 'object',
          required: ['first', 'last', 'prev', 'next'],
          properties: Object.fromEntries(
            ['first', 'last', 'prev', 'next'].map((k) => [k, { type: 'string', nullable: true }]),
          ),
        },
      },
    },
  };
}
