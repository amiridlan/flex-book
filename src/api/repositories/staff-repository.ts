import { z } from 'zod';

import type { ApiClient } from '../client/api-client';
import {
  staffBookingSchema,
  type StaffBooking,
  type StaffCheckInInput,
  type WalkInInput,
} from '../schemas/booking';
import { resourceSchema } from '../schemas/common';

export type StaffRepository = {
  /** Bookings at one location on a local date (defaults to today there). */
  bookings(locationId: string, date?: string): Promise<readonly StaffBooking[]>;
  /** Today at every location in scope. Admins only. */
  allBookings(): Promise<readonly StaffBooking[]>;
  checkIn(input: StaffCheckInInput): Promise<StaffBooking>;
  walkIn(input: WalkInInput): Promise<StaffBooking>;
};

const one = resourceSchema(staffBookingSchema);

export function createStaffRepository(api: ApiClient): StaffRepository {
  return {
    async bookings(locationId, date) {
      const response = await api.request(
        'GET',
        `/staff/locations/${encodeURIComponent(locationId)}/bookings`,
        z.object({ data: z.array(staffBookingSchema) }),
        { query: { date } },
      );
      return response.data;
    },
    async allBookings() {
      return (
        await api.request('GET', '/staff/bookings', z.object({ data: z.array(staffBookingSchema) }))
      ).data;
    },
    async checkIn(input) {
      return (await api.request('POST', '/staff/check-ins', one, { body: input })).data;
    },
    async walkIn(input) {
      return (await api.request('POST', '/staff/walk-ins', one, { body: input })).data;
    },
  };
}
