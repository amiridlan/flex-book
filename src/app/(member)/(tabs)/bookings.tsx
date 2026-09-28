import { useState } from 'react';
import { Text, View } from 'react-native';

import type { Booking } from '@/api/schemas/booking';
import { CardGrid } from '@/components/ui/card-grid';
import { Chip } from '@/components/ui/chip';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { BookingCard } from '@/features/booking/components/booking-card';
import { useMyBookings } from '@/features/booking/use-bookings';
import { useBrands } from '@/features/catalog/use-catalog';
import { useNow } from '@/lib/use-now';

type Tab = 'upcoming' | 'past';

function isUpcoming(booking: Booking, now: number): boolean {
  return (
    (booking.status === 'confirmed' || booking.status === 'checked_in') &&
    Date.parse(booking.endsAt) > now
  );
}

export default function BookingsScreen() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const bookings = useMyBookings();
  const brands = useBrands();

  const now = useNow();
  const list = (bookings.data ?? []).filter((b) => (tab === 'upcoming') === isUpcoming(b, now));
  // Upcoming soonest first; past most recent first.
  const sorted = tab === 'upcoming' ? list : [...list].reverse();

  return (
    <Screen scroll>
      <ScreenHeader title="My bookings" />
      <View className="flex-row gap-2">
        <Chip label="Upcoming" selected={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <Chip label="Past" selected={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      {bookings.isPending ? (
        <LoadingState label="Loading bookings…" />
      ) : bookings.isError ? (
        <ErrorState error={bookings.error} onRetry={() => void bookings.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          message={
            tab === 'upcoming'
              ? 'Find a space in Explore. Your QR code for check-in will appear here.'
              : undefined
          }
        />
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-text-muted">
            {sorted.length === 1 ? '1 booking' : `${sorted.length} bookings`}
          </Text>
          <CardGrid>
            {sorted.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                brand={brands.data?.find((b) => b.id === booking.location.brandId)}
              />
            ))}
          </CardGrid>
        </View>
      )}
    </Screen>
  );
}
