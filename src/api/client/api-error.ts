export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'invalid_response';

/** The single error shape every repository call rejects with. */
export type ApiError = {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly message: string;
  /** Laravel 422 field errors, keyed by field name. */
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
};

const API_ERROR_BRAND = Symbol('ApiError');

type BrandedApiError = ApiError & { readonly [API_ERROR_BRAND]: true };

export function createApiError(
  kind: ApiErrorKind,
  status: number | null,
  message: string,
  fieldErrors: Readonly<Record<string, readonly string[]>> = {},
): ApiError {
  const error: BrandedApiError = { kind, status, message, fieldErrors, [API_ERROR_BRAND]: true };
  return error;
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && API_ERROR_BRAND in value;
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 422) return 'validation';
  return 'server';
}

/** Turns anything thrown into a user-safe message. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  return 'Something went wrong. Please try again.';
}

/** The most specific message for a banner: the first 422 field error, else the error message. */
export function firstError(error: unknown): string | null {
  if (!error) return null;
  if (isApiError(error)) return Object.values(error.fieldErrors)[0]?.[0] ?? error.message;
  return errorMessage(error);
}
