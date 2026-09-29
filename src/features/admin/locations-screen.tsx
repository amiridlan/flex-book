import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { firstError } from '@/api/client/api-error';
import type { LocationSettingsView } from '@/api/schemas/admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Cell, Table, TableRow } from '@/components/ui/table';
import { TextField } from '@/components/ui/text-field';
import { TwoColumn } from '@/components/ui/two-column';
import { hasPermission } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { useBrands } from '@/features/catalog/use-catalog';
import { useLayout } from '@/lib/use-layout';

import { useLocationSettings, useSaveLocationSettings } from './use-admin';

const COLUMNS = [
  { label: 'Location', width: 'flex-1' },
  { label: 'Brand', width: 'w-40' },
  { label: 'Status', width: 'w-24' },
  { label: 'Rules', width: 'w-32' },
] as const;

const rulesLabel = (l: LocationSettingsView) =>
  `${l.bookingRules.sameDayRadiusKm} km · ${l.bookingRules.checkInRadiusM} m`;

/** Super admin: close locations or rooms for a while, and tune the booking rules. */
export function LocationsScreen() {
  const me = useSessionStore((s) => s.user);
  const locations = useLocationSettings();
  const brands = useBrands();
  const { wide } = useLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!hasPermission(me, 'locations.manage')) {
    return (
      <Screen>
        <EmptyState title="Super admins only" />
      </Screen>
    );
  }
  if (locations.isPending) return <LoadingState label="Loading locations…" />;
  if (locations.isError) {
    return (
      <Screen>
        <ErrorState error={locations.error} onRetry={() => void locations.refetch()} />
      </Screen>
    );
  }

  const brandName = (id: string) => brands.data?.find((b) => b.id === id)?.name ?? id;
  const selected = locations.data.find((l) => l.id === selectedId) ?? null;
  const editor = selected ? (
    <SettingsEditor key={selected.id} location={selected} />
  ) : (
    <View className="gap-2 rounded-xl border border-dashed border-border p-5">
      <Text className="text-base font-semibold text-text">Choose a location</Text>
      <Text className="text-sm text-text-muted">
        Close it or one of its rooms for a while, or change how close members must be to book and
        check in.
      </Text>
    </View>
  );

  return (
    <Screen scroll>
      <PageHeader
        title="Locations"
        subtitle="Temporary closures and booking rules. Members stop seeing closed places at once."
      />
      {wide ? (
        <TwoColumn
          main={
            <Table columns={COLUMNS} label="Locations">
              {locations.data.map((l) => (
                <TableRow
                  key={l.id}
                  accessibilityLabel={`${l.name}, ${l.city}`}
                  highlight={l.id === selectedId}
                  onPress={() => setSelectedId(l.id)}
                >
                  <Cell width="flex-1">
                    <Text className="text-sm font-medium text-text">{l.name}</Text>
                    <Text className="text-xs text-text-muted">{l.city}</Text>
                  </Cell>
                  <Cell width="w-40">
                    <Text className="text-sm text-text">{brandName(l.brandId)}</Text>
                  </Cell>
                  <Cell width="w-24">
                    <OpenPill closed={l.closed} />
                  </Cell>
                  <Cell width="w-32">
                    <Text className="text-sm text-text-muted">{rulesLabel(l)}</Text>
                  </Cell>
                </TableRow>
              ))}
            </Table>
          }
          aside={editor}
        />
      ) : selected ? (
        <View className="gap-4">
          <Button label="Back to locations" variant="ghost" onPress={() => setSelectedId(null)} />
          {editor}
        </View>
      ) : (
        <View className="gap-3">
          {locations.data.map((l) => (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={`${l.name}, ${l.city}`}
              onPress={() => setSelectedId(l.id)}
              className="gap-1 rounded-2xl border border-border bg-surface p-4 active:bg-surface-muted"
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-base font-semibold text-text">{l.name}</Text>
                <OpenPill closed={l.closed} />
              </View>
              <Text className="text-sm text-text-muted">
                {brandName(l.brandId)} · {l.city} · {rulesLabel(l)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function SettingsEditor({ location }: { readonly location: LocationSettingsView }) {
  const save = useSaveLocationSettings();
  const [closed, setClosed] = useState(location.closed);
  const [spaces, setSpaces] = useState(location.spaces);
  const [km, setKm] = useState(String(location.bookingRules.sameDayRadiusKm));
  const [metres, setMetres] = useState(String(location.bookingRules.checkInRadiusM));
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false);

  const rules = { sameDayRadiusKm: Number(km), checkInRadiusM: Number(metres) };
  const rulesChanged =
    rules.sameDayRadiusKm !== location.bookingRules.sameDayRadiusKm ||
    rules.checkInRadiusM !== location.bookingRules.checkInRadiusM;
  const spaceChanges = spaces.filter(
    (sp) => sp.closed !== location.spaces.find((o) => o.id === sp.id)?.closed,
  );
  const changed = closed !== location.closed || rulesChanged || spaceChanges.length > 0;
  const error = firstError(save.error);

  function submit() {
    setSaved(false);
    save.mutate(
      {
        locationId: location.id,
        location:
          closed !== location.closed || rulesChanged
            ? {
                ...(closed !== location.closed ? { closed } : {}),
                ...(rulesChanged ? { bookingRules: rules } : {}),
              }
            : null,
        spaces: spaceChanges.map((sp) => ({ id: sp.id, closed: sp.closed })),
        reason,
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <Card>
      <Text accessibilityRole="header" className="text-lg font-semibold text-text">
        {location.name}
      </Text>
      <Text className="text-sm text-text-muted">{location.city}</Text>
      <View className="gap-5 pt-2">
        <View className="gap-2">
          <Text className="text-sm font-semibold text-text">Location</Text>
          <View className="flex-row gap-2">
            <Chip label="Open" selected={!closed} onPress={() => setClosed(false)} />
            <Chip label="Temporarily closed" selected={closed} onPress={() => setClosed(true)} />
          </View>
          {location.closedReason ? (
            <Text className="text-sm text-text-muted">Closed because: {location.closedReason}</Text>
          ) : null}
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-text">Spaces</Text>
          {spaces.map((sp) => (
            <View key={sp.id} className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="flex-1 text-sm text-text">{sp.name}</Text>
              <Chip
                label={sp.closed ? `Closed: ${sp.name}` : `Open: ${sp.name}`}
                selected={!sp.closed}
                onPress={() =>
                  setSpaces((all) =>
                    all.map((o) => (o.id === sp.id ? { ...o, closed: !o.closed } : o)),
                  )
                }
              />
            </View>
          ))}
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold text-text">Booking rules</Text>
          <TextField
            label="Same-day booking radius (km)"
            keyboardType="numeric"
            value={km}
            onChangeText={setKm}
            hint="Members booking for today must be this close."
          />
          <TextField
            label="Check-in radius (m)"
            keyboardType="numeric"
            value={metres}
            onChangeText={setMetres}
            hint="How close a member must be to check in from their phone."
          />
        </View>

        <TextField
          label="Reason for the change"
          value={reason}
          onChangeText={setReason}
          hint="Required. Saved in the activity log."
        />
        {error ? (
          <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-3">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        ) : null}
        {saved && !save.isPending ? (
          <Text accessibilityRole="alert" className="text-sm font-semibold text-success">
            Saved, and logged in Activity.
          </Text>
        ) : null}
        <Button
          label="Save changes"
          onPress={submit}
          loading={save.isPending}
          disabled={!changed}
        />
      </View>
    </Card>
  );
}

function OpenPill({ closed }: { readonly closed: boolean }) {
  return (
    <View
      className={`self-start rounded-full px-2 py-0.5 ${closed ? 'bg-danger-soft' : 'bg-success-soft'}`}
    >
      <Text className={`text-xs font-semibold ${closed ? 'text-danger' : 'text-success'}`}>
        {closed ? 'Closed' : 'Open'}
      </Text>
    </View>
  );
}
