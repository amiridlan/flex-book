import { Text } from 'react-native';

import type { StaffBooking } from '@/api/schemas/booking';
import { Button } from '@/components/ui/button';
import { Cell, Table, TableRow, type Column } from '@/components/ui/table';
import { checkInWindowOpen } from '@/domain/booking-rules';
import { StatusPill } from '@/features/booking/components/status-pill';
import { formatInZone, TIME_FORMAT } from '@/lib/time';

const TIME: Column = { label: 'Time', width: 'w-44' };
const LOCATION: Column = { label: 'Location', width: 'w-40' };
const SPACE: Column = { label: 'Space', width: 'w-48' };
const GUEST: Column = { label: 'Guest', width: 'flex-1' };
const REF: Column = { label: 'Ref', width: 'w-24' };
const STATUS: Column = { label: 'Status', width: 'w-28' };
const ACTION: Column = { label: 'Action', width: 'w-32' };

type StaffBookingTableProps = {
  readonly bookings: readonly StaffBooking[];
  readonly now: number;
  readonly pendingCode: string | null;
  readonly onCheckIn: (booking: StaffBooking) => void;
  /** All-locations board: adds a Location column. */
  readonly showLocation?: boolean;
  /** Super admins: an Override button on bookings that can still change. */
  readonly onOverride?: (booking: StaffBooking) => void;
};

/** Bookings an override can still change: upcoming, arriving, or marked no-show. */
export function canOverride(booking: StaffBooking): boolean {
  return booking.status === 'confirmed' || booking.status === 'no_show';
}

/** Desktop front-desk board: the whole day in time order; guests arriving now are highlighted. */
export function StaffBookingTable({
  bookings,
  now,
  pendingCode,
  onCheckIn,
  showLocation = false,
  onOverride,
}: StaffBookingTableProps) {
  const columns = showLocation
    ? [TIME, LOCATION, SPACE, GUEST, REF, STATUS, ACTION]
    : [TIME, SPACE, GUEST, REF, STATUS, ACTION];
  return (
    <Table columns={columns} label="Today’s bookings">
      {bookings.map((b) => {
        const tz = b.location.timezone;
        const time = `${formatInZone(b.startsAt, tz, TIME_FORMAT)} – ${formatInZone(b.endsAt, tz, TIME_FORMAT)}`;
        const arriving = b.status === 'confirmed' && checkInWindowOpen(b.startsAt, now);
        return (
          <TableRow
            key={b.id}
            highlight={arriving}
            accessibilityLabel={`${time}, ${b.space.name}, ${b.customer.name}, ${b.status.replace('_', ' ')}`}
          >
            <Cell width={TIME.width}>
              <Text className="text-sm font-medium text-text">{time}</Text>
              {showLocation ? (
                <Text className="text-xs text-text-muted">{b.location.city} time</Text>
              ) : null}
            </Cell>
            {showLocation ? (
              <Cell width={LOCATION.width}>
                <Text className="text-sm text-text">{b.location.name}</Text>
              </Cell>
            ) : null}
            <Cell width={SPACE.width}>
              <Text className="text-sm text-text">{b.space.name}</Text>
            </Cell>
            <Cell width={GUEST.width}>
              <Text className="text-sm font-medium text-text">{b.customer.name}</Text>
              <Text className="text-xs text-text-muted">{b.customer.emailMasked}</Text>
            </Cell>
            <Cell width={REF.width}>
              <Text className="text-sm text-text-muted">{b.code}</Text>
            </Cell>
            <Cell width={STATUS.width}>
              <StatusPill status={b.status} />
            </Cell>
            <Cell width={ACTION.width}>
              {arriving ? (
                <Button
                  label="Check in"
                  accessibilityLabel={`Check in ${b.customer.name}`}
                  loading={pendingCode === b.code}
                  onPress={() => onCheckIn(b)}
                />
              ) : null}
              {onOverride && canOverride(b) ? (
                <Button
                  label="Override"
                  variant="ghost"
                  accessibilityLabel={`Override booking for ${b.customer.name}`}
                  onPress={() => onOverride(b)}
                />
              ) : null}
              {!arriving && !(onOverride && canOverride(b)) ? (
                <Text className="text-sm text-text-muted">—</Text>
              ) : null}
            </Cell>
          </TableRow>
        );
      })}
    </Table>
  );
}
