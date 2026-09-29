import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import type { AuditAction, AuditEvent } from '@/api/schemas/admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { hasPermission } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { deviceTimeZone, formatInZone, TIME_FORMAT } from '@/lib/time';

import { useAuditTrail } from './use-admin';

type Group = 'all' | 'access' | 'accounts' | 'bookings' | 'locations';

const GROUPS: readonly { readonly id: Group; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'access', label: 'Access' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'locations', label: 'Locations' },
];

const ACTIONS: Readonly<Record<AuditAction, { readonly label: string; readonly group: Group }>> = {
  'access.updated': { label: 'Changed access', group: 'access' },
  'account.suspended': { label: 'Suspended account', group: 'accounts' },
  'account.reactivated': { label: 'Reactivated account', group: 'accounts' },
  'staff.invited': { label: 'Invited staff', group: 'accounts' },
  'booking.cancelled': { label: 'Cancelled booking', group: 'bookings' },
  'booking.checked_in': { label: 'Checked in manually', group: 'bookings' },
  'location.closed': { label: 'Closed location', group: 'locations' },
  'location.reopened': { label: 'Reopened location', group: 'locations' },
  'space.closed': { label: 'Closed space', group: 'locations' },
  'space.reopened': { label: 'Reopened space', group: 'locations' },
  'rules.updated': { label: 'Changed booking rules', group: 'locations' },
};

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

/**
 * Super admin: the audit trail. Each entry is a structured record (who, what,
 * target, before/after, reason), shown readably, or as raw JSON for export.
 */
export function ActivityScreen() {
  const me = useSessionStore((s) => s.user);
  const trail = useAuditTrail();
  const [group, setGroup] = useState<Group>('all');
  const [raw, setRaw] = useState(false);

  if (!hasPermission(me, 'audit.view')) {
    return (
      <Screen>
        <EmptyState title="Super admins only" />
      </Screen>
    );
  }
  if (trail.isPending) return <LoadingState label="Loading activity…" />;
  if (trail.isError) {
    return (
      <Screen>
        <ErrorState error={trail.error} onRetry={() => void trail.refetch()} />
      </Screen>
    );
  }

  const shown = trail.data.filter((e) => group === 'all' || ACTIONS[e.action].group === group);

  return (
    <Screen scroll>
      <PageHeader
        title="Activity log"
        subtitle="Every admin action, newest first. Each entry is a structured record."
        actions={
          <Button
            label={raw ? 'Readable view' : 'Show as JSON'}
            variant="secondary"
            onPress={() => setRaw((r) => !r)}
          />
        }
      />
      <View className="flex-row flex-wrap gap-2">
        {GROUPS.map((g) => (
          <Chip
            key={g.id}
            label={g.label}
            selected={group === g.id}
            onPress={() => setGroup(g.id)}
          />
        ))}
      </View>

      {shown.length === 0 ? (
        <EmptyState
          title="No admin actions yet"
          message="Access changes, suspensions and overrides appear here as they happen."
        />
      ) : raw ? (
        <Card>
          <Text selectable style={{ fontFamily: MONO }} className="text-xs text-text">
            {JSON.stringify(shown, null, 2)}
          </Text>
        </Card>
      ) : (
        <View className="gap-3">
          {shown.map((event) => (
            <Entry key={event.id} event={event} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Entry({ event }: { readonly event: AuditEvent }) {
  const zone = deviceTimeZone();
  return (
    <Card>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="text-base font-semibold text-text">
          {ACTIONS[event.action].label} · {event.target.label}
        </Text>
        <Text className="text-xs text-text-muted">
          {formatInZone(event.at, zone, `dd/MM/yyyy ${TIME_FORMAT}`)}
        </Text>
      </View>
      <Text className="text-sm text-text-muted">By {event.actor.name}</Text>
      {event.changes.map((change) => (
        <Text key={change.field} className="text-sm text-text">
          <Text className="font-semibold">{change.field}: </Text>
          {change.from} → {change.to}
        </Text>
      ))}
      {event.reason ? (
        <Text className="text-sm text-text">
          <Text className="font-semibold">Reason: </Text>
          {event.reason}
        </Text>
      ) : null}
    </Card>
  );
}
