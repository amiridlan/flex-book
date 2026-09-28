import { z } from 'zod';

import type { ApiClient } from '../client/api-client';
import { bookingSchema, type Booking, type CreateBookingInput } from '../schemas/booking';
import { resourceSchema } from '../schemas/common';
import type { DeviceFix } from '@/domain/booking-rules';

export type BookingRepository = {
  create(input: CreateBookingInput): Promise<Booking>;
  mine(): Promise<readonly Booking[]>;
  get(id: string): Promise<Booking>;
  cancel(id: string): Promise<Booking>;
  checkIn(id: string, device: DeviceFix | null): Promise<Booking>;
};

const one = resourceSchema(bookingSchema);

export function createBookingRepository(api: ApiClient): BookingRepository {
  const path = (id: string) => `/bookings/${encodeURIComponent(id)}`;
  return {
    async create(input) {
      return (await api.request('POST', '/bookings', one, { body: input })).data;
    },
    async mine() {
      return (await api.request('GET', '/bookings', z.object({ data: z.array(bookingSchema) })))
        .data;
    },
    async get(id) {
      return (await api.request('GET', path(id), one)).data;
    },
    async cancel(id) {
      return (await api.request('PATCH', path(id), one, { body: { status: 'cancelled' } })).data;
    },
    async checkIn(id, device) {
      return (
        await api.request('POST', `${path(id)}/check-in`, one, { body: { method: 'geo', device } })
      ).data;
    },
  };
}
