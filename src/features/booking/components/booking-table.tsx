import { Text } from 'react-native';

import type { Booking } from '@/api/schemas/booking';
import { Cell, Table, TableRow, type Column } from '@/components/ui/table';
import { formatInZone, TIME_FORMAT } from '@/lib/time';

import { StatusPill } from './status-pill';

const COLUMNS = [
  { label: 'Date', width: 'w-36' },
  { label: 'Time (local)', width: 'w-44' },
  { label: 'Space', width: 'flex-1' },
  { label: 'Location', width: 'flex-1' },
  { label: 'Status', width: 'w-28' },
  { label: 'Ref', width: 'w-24' },
] as const satisfies readonly Column[];

/** Desktop "My bookings": one row per booking, whole row opens the booking. */
export function BookingTable({ bookings }: { readonly bookings: readonly Booking[] }) {
  return (
    <Table columns={COLUMNS} label="My bookings">
      {bookings.map((b) => {
        const tz = b.location.timezone;
        const date = formatInZone(b.startsAt, tz, 'EEE, dd/MM/yyyy');
        const time = `${formatInZone(b.startsAt, tz, TIME_FORMAT)} – ${formatInZone(b.endsAt, tz, TIME_FORMAT)}`;
        return (
          <TableRow
            key={b.id}
            href={{ pathname: '/bookings/[id]', params: { id: b.id } }}
            accessibilityLabel={`${b.space.name} at ${b.location.name}, ${date}, ${time}`}
          >
            <Cell width={COLUMNS[0].width}>
              <Text className="text-sm font-medium text-text">{date}</Text>
            </Cell>
            <Cell width={COLUMNS[1].width}>
              <Text className="text-sm text-text">{time}</Text>
            </Cell>
            <Cell width={COLUMNS[2].width}>
              <Text className="text-sm text-text">{b.space.name}</Text>
            </Cell>
            <Cell width={COLUMNS[3].width}>
              <Text className="text-sm text-text">{b.location.name}</Text>
              <Text className="text-xs text-text-muted">{b.location.city}</Text>
            </Cell>
            <Cell width={COLUMNS[4].width}>
              <StatusPill status={b.status} />
            </Cell>
            <Cell width={COLUMNS[5].width}>
              <Text className="text-sm text-text-muted">{b.code}</Text>
            </Cell>
          </TableRow>
        );
      })}
    </Table>
  );
}
