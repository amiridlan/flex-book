import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bookingRepository } from '@/api';
import type { Booking, CreateBookingInput } from '@/api/schemas/booking';
import type { DeviceFix } from '@/domain/booking-rules';
import { queryKeys } from '@/lib/query-keys';

export function useMyBookings() {
  return useQuery({ queryKey: queryKeys.bookings.mine, queryFn: () => bookingRepository.mine() });
}

export function useBooking(id: string, options: { readonly enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingRepository.get(id),
    enabled: options.enabled ?? true,
  });
}

/** After any booking change, the lists and that space's availability are stale. */
function useBookingChanged() {
  const queryClient = useQueryClient();
  return (booking: Booking) => {
    queryClient.setQueryData(queryKeys.bookings.detail(booking.id), booking);
    void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.availabilityForSpace(booking.space.id),
    });
  };
}

export function useCreateBooking() {
  const onChanged = useBookingChanged();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingRepository.create(input),
    onSuccess: onChanged,
  });
}

export function useCancelBooking() {
  const onChanged = useBookingChanged();
  return useMutation({
    mutationFn: (id: string) => bookingRepository.cancel(id),
    onSuccess: onChanged,
  });
}

export function useCheckIn() {
  const onChanged = useBookingChanged();
  return useMutation({
    mutationFn: ({ id, device }: { id: string; device: DeviceFix | null }) =>
      bookingRepository.checkIn(id, device),
    onSuccess: onChanged,
  });
}
