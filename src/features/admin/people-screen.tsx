import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { AdminUser } from '@/api/schemas/admin';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Cell, Table, TableRow } from '@/components/ui/table';
import { TwoColumn } from '@/components/ui/two-column';
import { describeAccess } from '@/domain/access';
import { hasPermission, ROLE_LABELS } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { useBrands } from '@/features/catalog/use-catalog';
import { useLocations } from '@/features/locations/use-locations';
import { useLayout } from '@/lib/use-layout';

import { AccessEditor } from './access-editor';
import { useAdminUsers } from './use-admin';

type Filter = 'everyone' | 'staff' | 'members';

const FILTERS: readonly { readonly id: Filter; readonly label: string }[] = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'staff', label: 'Staff and admins' },
  { id: 'members', label: 'Members' },
];

const COLUMNS = [
  { label: 'Person', width: 'flex-1' },
  { label: 'Role', width: 'w-32' },
  { label: 'Access', width: 'flex-1' },
  { label: 'Status', width: 'w-24' },
] as const;

/** Super admin: every account, and what each one can see. */
export function PeopleScreen() {
  const me = useSessionStore((s) => s.user);
  const users = useAdminUsers();
  const brands = useBrands();
  const locations = useLocations();
  const { wide } = useLayout();
  const [filter, setFilter] = useState<Filter>('everyone');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!hasPermission(me, 'users.manage')) {
    return (
      <Screen>
        <EmptyState title="Super admins only" message="Ask a super admin to change access." />
      </Screen>
    );
  }
  if (users.isPending || brands.isPending || locations.isPending) {
    return <LoadingState label="Loading people…" />;
  }
  if (users.isError || brands.isError || locations.isError) {
    return (
      <Screen>
        <ErrorState
          error={users.error ?? brands.error ?? locations.error}
          onRetry={() => {
            void users.refetch();
            void brands.refetch();
            void locations.refetch();
          }}
        />
      </Screen>
    );
  }

  const allLocations = locations.data.data;
  const names = {
    brand: (id: string) => brands.data.find((b) => b.id === id)?.name ?? id,
    location: (id: string) => allLocations.find((l) => l.id === id)?.name ?? id,
  };
  const shown = users.data.filter((u) =>
    filter === 'everyone' ? true : filter === 'members' ? u.role === 'member' : u.role !== 'member',
  );
  const selected = users.data.find((u) => u.id === selectedId) ?? null;
  const access = (u: AdminUser) => describeAccess(u.role, u.assignments, names);

  const editor = selected ? (
    <AccessEditor
      key={selected.id}
      user={selected}
      isSelf={selected.id === me?.id}
      brands={brands.data}
      locations={allLocations}
    />
  ) : (
    <View className="gap-2 rounded-xl border border-dashed border-border p-5">
      <Text className="text-base font-semibold text-text">Choose a person</Text>
      <Text className="text-sm text-text-muted">
        Pick someone from the list to change their role or the brands and locations they can see.
      </Text>
    </View>
  );

  const filters = (
    <View className="flex-row flex-wrap gap-2">
      {FILTERS.map((f) => (
        <Chip
          key={f.id}
          label={f.label}
          selected={filter === f.id}
          onPress={() => setFilter(f.id)}
        />
      ))}
    </View>
  );

  return (
    <Screen scroll>
      <PageHeader
        title="People and access"
        subtitle="Change what each person can see. Changes apply on their next action."
      />
      {wide ? (
        <TwoColumn
          main={
            <>
              {filters}
              <Table columns={COLUMNS} label="People">
                {shown.map((u) => (
                  <TableRow
                    key={u.id}
                    accessibilityLabel={`${u.name}, ${ROLE_LABELS[u.role]}`}
                    highlight={u.id === selectedId}
                    onPress={() => setSelectedId(u.id)}
                  >
                    <Cell width="flex-1">
                      <Text className="text-sm font-medium text-text">{u.name}</Text>
                      <Text className="text-xs text-text-muted">{u.email}</Text>
                    </Cell>
                    <Cell width="w-32">
                      <Text className="text-sm text-text">{ROLE_LABELS[u.role]}</Text>
                    </Cell>
                    <Cell width="flex-1">
                      <Text className="text-sm text-text-muted">{access(u)}</Text>
                    </Cell>
                    <Cell width="w-24">
                      <StatusPill status={u.status} />
                    </Cell>
                  </TableRow>
                ))}
              </Table>
            </>
          }
          aside={editor}
        />
      ) : selected ? (
        <View className="gap-4">
          <Button label="Back to everyone" variant="ghost" onPress={() => setSelectedId(null)} />
          {editor}
        </View>
      ) : (
        <View className="gap-3">
          {filters}
          {shown.map((u) => (
            <Pressable
              key={u.id}
              accessibilityRole="button"
              accessibilityLabel={`${u.name}, ${ROLE_LABELS[u.role]}`}
              onPress={() => setSelectedId(u.id)}
              className="gap-1 rounded-2xl border border-border bg-surface p-4 active:bg-surface-muted"
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-base font-semibold text-text">{u.name}</Text>
                <StatusPill status={u.status} />
              </View>
              <Text className="text-sm text-text">{ROLE_LABELS[u.role]}</Text>
              <Text className="text-sm text-text-muted">{access(u)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function StatusPill({ status }: { readonly status: AdminUser['status'] }) {
  const active = status === 'active';
  return (
    <View
      className={`self-start rounded-full px-2 py-0.5 ${active ? 'bg-success-soft' : 'bg-danger-soft'}`}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-success' : 'text-danger'}`}>
        {active ? 'Active' : 'Suspended'}
      </Text>
    </View>
  );
}
