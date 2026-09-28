import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffRepository } from '@/api';
import type { StaffCheckInInput, WalkInInput } from '@/api/schemas/booking';
import { queryKeys } from '@/lib/query-keys';

/** Today's board for one location. Polls so check-ins from other desks show up. */
export function useStaffBookings(locationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staff.bookings(locationId ?? ''),
    queryFn: () => staffRepository.bookings(locationId ?? ''),
    enabled: Boolean(locationId),
    refetchInterval: 60_000,
  });
}

/** Any staff change invalidates every board and all availability. */
function useStaffChanged() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    void queryClient.invalidateQueries({ queryKey: ['availability'] });
  };
}

export function useStaffCheckIn() {
  const onChanged = useStaffChanged();
  return useMutation({
    mutationFn: (input: StaffCheckInInput) => staffRepository.checkIn(input),
    onSuccess: onChanged,
  });
}

export function useWalkIn() {
  const onChanged = useStaffChanged();
  return useMutation({
    mutationFn: (input: WalkInInput) => staffRepository.walkIn(input),
    onSuccess: onChanged,
  });
}
