import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminRepository } from '@/api';
import type { UpdateAccessInput } from '@/api/schemas/admin';
import { queryKeys } from '@/lib/query-keys';

export function useAdminUsers() {
  return useQuery({ queryKey: queryKeys.admin.users, queryFn: () => adminRepository.users() });
}

export function useAuditTrail() {
  return useQuery({ queryKey: queryKeys.admin.audit, queryFn: () => adminRepository.auditTrail() });
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
