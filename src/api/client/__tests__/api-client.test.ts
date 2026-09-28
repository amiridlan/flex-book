import { z } from 'zod';

import { createApiClient } from '../api-client';
import type { ApiError } from '../api-error';
import type { HttpResponse, HttpTransport } from '../transport';

function transportReturning(response: HttpResponse): HttpTransport & { send: jest.Mock } {
  return { send: jest.fn().mockResolvedValue(response) };
}

const itemSchema = z.object({ data: z.object({ id: z.string() }) });

describe('ApiClient', () => {
  it('sends the bearer token and returns parsed data', async () => {
    const transport = transportReturning({ status: 200, body: { data: { id: 'abc' } } });
    const api = createApiClient({ transport, getToken: () => 'token-1' });

    await expect(api.request('GET', '/things/abc', itemSchema)).resolves.toEqual({
      data: { id: 'abc' },
    });
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );
  });

  it('maps a Laravel 422 to a validation error with field errors', async () => {
    const transport = transportReturning({
      status: 422,
      body: {
        message: 'The email field is required.',
        errors: { email: ['The email field is required.'] },
      },
    });
    const api = createApiClient({ transport, getToken: () => null });

    await expect(api.request('POST', '/auth/login', itemSchema)).rejects.toMatchObject<
      Partial<ApiError>
    >({
      kind: 'validation',
      status: 422,
      fieldErrors: { email: ['The email field is required.'] },
    });
  });

  it('calls onUnauthorized on a 401', async () => {
    const onUnauthorized = jest.fn();
    const api = createApiClient({
      transport: transportReturning({ status: 401, body: { message: 'Unauthenticated.' } }),
      getToken: () => 'expired',
      onUnauthorized,
    });

    await expect(api.request('GET', '/me', itemSchema)).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('rejects a response that does not match the contract', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const api = createApiClient({
      transport: transportReturning({ status: 200, body: { data: { id: 42 } } }),
      getToken: () => null,
    });

    await expect(api.request('GET', '/things/42', itemSchema)).rejects.toMatchObject({
      kind: 'invalid_response',
    });
  });

  it('reports a network failure without a status', async () => {
    const api = createApiClient({
      transport: { send: jest.fn().mockRejectedValue(new TypeError('Network request failed')) },
      getToken: () => null,
    });

    await expect(api.request('GET', '/brands', itemSchema)).rejects.toMatchObject({
      kind: 'network',
      status: null,
    });
  });

  it('uses a friendly default message when the error body is not JSON', async () => {
    const api = createApiClient({
      transport: transportReturning({ status: 503, body: null }),
      getToken: () => null,
    });

    await expect(api.request('GET', '/brands', itemSchema)).rejects.toMatchObject({
      kind: 'server',
      message: 'The server had a problem. Please try again.',
    });
  });
});
