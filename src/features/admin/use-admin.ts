import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminRepository } from '@/api';
import type {
  InviteStaffInput,
  UpdateAccessInput,
  UpdateLocationSettingsInput,
  UpdateStatusInput,
} from '@/api/schemas/admin';
import { queryKeys } from '@/lib/query-keys';

export function useAdminUsers() {
  return useQuery({ queryKey: queryKeys.admin.users, queryFn: () => adminRepository.users() });
}

export function useAuditTrail() {
  return useQuery({ queryKey: queryKeys.admin.audit, queryFn: () => adminRepository.auditTrail() });
}

export function useFlaggedMembers() {
  return useQuery({ queryKey: queryKeys.admin.flags, queryFn: () => adminRepository.flagged() });
}

/** After any admin change, the people list, the audit trail and scoped data are stale. */
export function useAdminChanged() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
  };
}

export function useUpdateAccess() {
  const onChanged = useAdminChanged();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateAccessInput }) =>
      adminRepository.updateAccess(userId, input),
    onSuccess: onChanged,
  });
}

export function useSetStatus() {
  const onChanged = useAdminChanged();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateStatusInput }) =>
      adminRepository.setStatus(userId, input),
    onSuccess: onChanged,
  });
}

export function useInviteStaff() {
  const onChanged = useAdminChanged();
  return useMutation({
    mutationFn: (input: InviteStaffInput) => adminRepository.invite(input),
    onSuccess: onChanged,
  });
}

export function useLocationSettings() {
  return useQuery({
    queryKey: queryKeys.admin.locations,
    queryFn: () => adminRepository.locationSettings(),
  });
}

export type LocationSettingsChange = {
  readonly locationId: string;
  /** Sent only when the location's own status or rules changed. */
  readonly location: Omit<UpdateLocationSettingsInput, 'reason'> | null;
  readonly spaces: readonly { readonly id: string; readonly closed: boolean }[];
  readonly reason: string;
};

/** Saves a location's status, rules and space closures; each change is logged. */
export function useSaveLocationSettings() {
  const onChanged = useAdminChanged();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: LocationSettingsChange) => {
      if (change.location) {
        await adminRepository.updateLocation(change.locationId, {
          ...change.location,
          reason: change.reason,
        });
      }
      for (const space of change.spaces) {
        await adminRepository.updateSpace(space.id, {
          closed: space.closed,
          reason: change.reason,
        });
      }
    },
    onSuccess: () => {
      onChanged();
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
