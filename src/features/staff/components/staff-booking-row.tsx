import { Text, View } from 'react-native';

import type { StaffBooking } from '@/api/schemas/booking';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/features/booking/components/status-pill';
import { formatInZone, TIME_FORMAT } from '@/lib/time';

type StaffBookingRowProps = {
  readonly booking: StaffBooking;
  /** Shown only while the booking's check-in window is open. */
  readonly onCheckIn?: () => void;
  readonly checkingIn?: boolean;
  /** Super admins: open the override panel for this booking. */
  readonly onOverride?: () => void;
  /** All-locations board: name the location. */
  readonly showLocation?: boolean;
};

export function StaffBookingRow({
  booking,
  onCheckIn,
  checkingIn = false,
  onOverride,
  showLocation = false,
}: StaffBookingRowProps) {
  const tz = booking.location.timezone;
  const time = `${formatInZone(booking.startsAt, tz, TIME_FORMAT)} – ${formatInZone(booking.endsAt, tz, TIME_FORMAT)}`;
  return (
    <View
      accessibilityLabel={`${time}, ${booking.space.name}, ${booking.customer.name}, ${booking.status.replace('_', ' ')}`}
      className="gap-2 rounded-2xl border border-border bg-surface p-4"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-base font-semibold text-text">{time}</Text>
        <StatusPill status={booking.status} />
      </View>
      <Text className="text-sm text-text">
        {showLocation ? `${booking.location.name} · ` : ''}
        {booking.space.name}
      </Text>
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-medium text-text">{booking.customer.name}</Text>
          <Text className="text-xs text-text-muted">
            {booking.customer.emailMasked} · {booking.code}
          </Text>
        </View>
        {onCheckIn ? (
          <Button
            label="Check in"
            accessibilityLabel={`Check in ${booking.customer.name}`}
            onPress={onCheckIn}
            loading={checkingIn}
          />
        ) : null}
      </View>
      {onOverride ? (
        <Button
          label="Override"
          variant="ghost"
          accessibilityLabel={`Override booking for ${booking.customer.name}`}
          onPress={onOverride}
        />
      ) : null}
    </View>
  );
}
