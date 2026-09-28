import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { Brand } from '@/api/schemas/brand';
import type { Booking } from '@/api/schemas/booking';
import { Badge } from '@/components/ui/badge';
import { formatInZone, TIME_FORMAT } from '@/lib/time';
import { BrandThemeScope } from '@/theme/brand-theme';

import { StatusPill } from './status-pill';

export function BookingCard({ booking, brand }: { booking: Booking; brand: Brand | undefined }) {
  const tz = booking.location.timezone;
  const when = `${formatInZone(booking.startsAt, tz, 'EEE, dd/MM/yyyy')} · ${formatInZone(
    booking.startsAt,
    tz,
    TIME_FORMAT,
  )} – ${formatInZone(booking.endsAt, tz, TIME_FORMAT)}`;

  return (
    <BrandThemeScope theme={brand?.theme}>
      <Link href={{ pathname: '/bookings/[id]', params: { id: booking.id } }} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${booking.space.name} at ${booking.location.name}, ${when}`}
          className="gap-2 rounded-2xl border border-border bg-surface p-4 active:bg-surface-muted"
        >
          <View className="flex-row items-center justify-between">
            <Badge label={brand?.name ?? booking.location.brandId} />
            <StatusPill status={booking.status} />
          </View>
          <Text className="text-base font-semibold text-text">{booking.space.name}</Text>
          <Text className="text-sm text-text-muted">
            {booking.location.name}, {booking.location.city}
          </Text>
          <Text className="text-sm text-text">{when}</Text>
        </Pressable>
      </Link>
    </BrandThemeScope>
  );
}
