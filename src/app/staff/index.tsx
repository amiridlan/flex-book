import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { firstError } from '@/api/client/api-error';
import type { StaffBooking } from '@/api/schemas/booking';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { checkInWindowOpen } from '@/domain/booking-rules';
import { useSessionStore } from '@/features/auth/session-store';
import { LocationSwitcher } from '@/features/staff/components/location-switcher';
import { StaffBrandScope } from '@/features/staff/components/staff-brand-scope';
import { StaffBookingRow } from '@/features/staff/components/staff-booking-row';
import { useStaffBookings, useStaffCheckIn } from '@/features/staff/use-staff';
import { useStaffLocation } from '@/features/staff/use-staff-location';
import { formatInZone, offsetLabel, TIME_FORMAT } from '@/lib/time';
import { useNow } from '@/lib/use-now';

type Groups = {
  arriving: StaffBooking[];
  later: StaffBooking[];
  inside: StaffBooking[];
  closed: StaffBooking[];
};

function groupBookings(bookings: readonly StaffBooking[], now: number): Groups {
  const groups: Groups = { arriving: [], later: [], inside: [], closed: [] };
  for (const b of bookings) {
    if (b.status === 'confirmed') {
      (checkInWindowOpen(b.startsAt, now) ? groups.arriving : groups.later).push(b);
    } else if (b.status === 'checked_in' || b.status === 'completed') {
      groups.inside.push(b);
    } else {
      groups.closed.push(b);
    }
  }
  return groups;
}

export default function StaffTodayScreen() {
  const user = useSessionStore((s) => s.user);
  const { locations, all, current, setLocationId } = useStaffLocation();
  const board = useStaffBookings(current?.id);
  const checkIn = useStaffCheckIn();
  const now = useNow(30_000);

  if (locations.isPending) return <LoadingState label="Loading your locations…" />;
  if (locations.isError) {
    return (
      <Screen>
        <ErrorState error={locations.error} onRetry={() => void locations.refetch()} />
      </Screen>
    );
  }
  if (!current) {
    return (
      <Screen>
        <EmptyState
          title="No locations assigned"
          message="Ask your brand admin to add you to a location."
        />
      </Screen>
    );
  }

  const groups = groupBookings(board.data ?? [], now);
  const noShows = groups.closed.filter((b) => b.status === 'no_show').length;
  const checkInError = firstError(checkIn.error);
  const pendingCode =
    checkIn.isPending && checkIn.variables && 'code' in checkIn.variables
      ? checkIn.variables.code
      : null;

  return (
    <StaffBrandScope>
      <Screen scroll>
        <ScreenHeader
          title={`Today · ${current.name}`}
          subtitle={`${formatInZone(now, current.timezone, 'EEE, dd/MM/yyyy')} · ${formatInZone(
            now,
            current.timezone,
            TIME_FORMAT,
          )} ${current.city} (${offsetLabel(current.timezone, now)}) · ${user?.name ?? ''}`}
        />
        <LocationSwitcher locations={all} currentId={current.id} onSelect={setLocationId} />

        {board.isPending ? (
          <LoadingState label="Loading today’s bookings…" />
        ) : board.isError ? (
          <ErrorState error={board.error} onRetry={() => void board.refetch()} />
        ) : board.data.length === 0 ? (
          <EmptyState title="No bookings today" message="Walk-ins you add will appear here." />
        ) : (
          <View className="gap-5">
            <View className="flex-row gap-2">
              <Stat label="Arriving" value={groups.arriving.length} />
              <Stat label="Later" value={groups.later.length} />
              <Stat label="Checked in" value={groups.inside.length} />
              <Stat label="No-shows" value={noShows} />
            </View>

            {checkInError ? (
              <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-4">
                <Text className="text-sm text-danger">{checkInError}</Text>
              </View>
            ) : null}

            <Section title="Arriving now" empty="Nobody due in the next 15 minutes.">
              {groups.arriving.map((b) => (
                <StaffBookingRow
                  key={b.id}
                  booking={b}
                  checkingIn={pendingCode === b.code}
                  onCheckIn={() => checkIn.mutate({ code: b.code })}
                />
              ))}
            </Section>
            <Section title="Later today" empty="No more bookings today.">
              {groups.later.map((b) => (
                <StaffBookingRow key={b.id} booking={b} />
              ))}
            </Section>
            <Section title="Checked in">
              {groups.inside.map((b) => (
                <StaffBookingRow key={b.id} booking={b} />
              ))}
            </Section>
            <Section title="No-shows and cancellations">
              {groups.closed.map((b) => (
                <StaffBookingRow key={b.id} booking={b} />
              ))}
            </Section>
            {noShows > 0 ? (
              <Text className="text-xs text-text-muted">
                No-shows are released automatically 15 minutes after the start, so the space can be
                offered to walk-ins.
              </Text>
            ) : null}
          </View>
        )}
      </Screen>
    </StaffBrandScope>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <View
      accessibilityLabel={`${value} ${label}`}
      className="flex-1 items-center gap-1 rounded-xl bg-primary-soft py-3"
    >
      <Text className="text-xl font-bold text-primary">{value}</Text>
      <Text className="text-xs text-text">{label}</Text>
    </View>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  readonly title: string;
  readonly empty?: string;
  readonly children: readonly ReactNode[];
}) {
  if (children.length === 0 && !empty) return null;
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="text-lg font-semibold text-text">
        {title}
      </Text>
      {children.length === 0 ? <Text className="text-sm text-text-muted">{empty}</Text> : children}
    </View>
  );
}
