import { Text } from 'react-native';

import type { StaffBooking } from '@/api/schemas/booking';
import { Button } from '@/components/ui/button';
import { Cell, Table, TableRow, type Column } from '@/components/ui/table';
import { checkInWindowOpen } from '@/domain/booking-rules';
import { StatusPill } from '@/features/booking/components/status-pill';
import { formatInZone, TIME_FORMAT } from '@/lib/time';

const COLUMNS = [
  { label: 'Time', width: 'w-44' },
  { label: 'Space', width: 'w-48' },
  { label: 'Guest', width: 'flex-1' },
  { label: 'Ref', width: 'w-24' },
  { label: 'Status', width: 'w-28' },
  { label: 'Action', width: 'w-32' },
] as const satisfies readonly Column[];

type StaffBookingTableProps = {
  readonly bookings: readonly StaffBooking[];
  readonly now: number;
  readonly pendingCode: string | null;
  readonly onCheckIn: (code: string) => void;
};

/** Desktop front-desk board: the whole day in time order; guests arriving now are highlighted. */
export function StaffBookingTable({
  bookings,
  now,
  pendingCode,
  onCheckIn,
}: StaffBookingTableProps) {
  return (
    <Table columns={COLUMNS} label="Today’s bookings">
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
            <Cell width={COLUMNS[0].width}>
              <Text className="text-sm font-medium text-text">{time}</Text>
            </Cell>
            <Cell width={COLUMNS[1].width}>
              <Text className="text-sm text-text">{b.space.name}</Text>
            </Cell>
            <Cell width={COLUMNS[2].width}>
              <Text className="text-sm font-medium text-text">{b.customer.name}</Text>
              <Text className="text-xs text-text-muted">{b.customer.emailMasked}</Text>
            </Cell>
            <Cell width={COLUMNS[3].width}>
              <Text className="text-sm text-text-muted">{b.code}</Text>
            </Cell>
            <Cell width={COLUMNS[4].width}>
              <StatusPill status={b.status} />
            </Cell>
            <Cell width={COLUMNS[5].width}>
              {arriving ? (
                <Button
                  label="Check in"
                  accessibilityLabel={`Check in ${b.customer.name}`}
                  loading={pendingCode === b.code}
                  onPress={() => onCheckIn(b.code)}
                />
              ) : (
                <Text className="text-sm text-text-muted">—</Text>
              )}
            </Cell>
          </TableRow>
        );
      })}
    </Table>
  );
}
