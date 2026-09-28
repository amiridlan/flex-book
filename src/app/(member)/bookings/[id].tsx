import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { errorMessage, isApiError } from '@/api/client/api-error';
import { QrCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { canCancel, checkInWindowOpen, CHECK_IN_OPENS_MIN } from '@/domain/booking-rules';
import { PriceBreakdown } from '@/features/booking/components/price-breakdown';
import { StatusPill } from '@/features/booking/components/status-pill';
import { useBooking, useCancelBooking, useCheckIn } from '@/features/booking/use-bookings';
import { useBrands } from '@/features/catalog/use-catalog';
import { useDeviceLocation } from '@/features/device-location/use-device-location';
import { deviceTimeZone, formatInZone, sameOffset, TIME_FORMAT } from '@/lib/time';
import { useNow } from '@/lib/use-now';
import { BrandThemeScope } from '@/theme/brand-theme';

/** Payload of the check-in QR. Staff scanners (P4) parse this deep link. */
export function checkInPayload(bookingId: string, token: string): string {
  return `flexbook://check-in/${bookingId}?token=${token}`;
}

function firstError(error: unknown): string | null {
  if (!error) return null;
  if (isApiError(error)) return Object.values(error.fieldErrors)[0]?.[0] ?? error.message;
  return errorMessage(error);
}

export default function BookingDetailScreen() {
  const { id, confirmed } = useLocalSearchParams<{ id: string; confirmed?: string }>();
  const booking = useBooking(id);
  const brands = useBrands();
  const cancel = useCancelBooking();
  const checkIn = useCheckIn();
  const device = useDeviceLocation();
  const now = useNow(30_000);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (booking.isPending) return <LoadingState label="Loading booking…" />;
  if (booking.isError) {
    return (
      <View className="p-4">
        <ErrorState error={booking.error} onRetry={() => void booking.refetch()} />
      </View>
    );
  }

  const b = booking.data;
  const tz = b.location.timezone;
  const device_tz = deviceTimeZone();
  const upcoming = b.status === 'confirmed' && Date.parse(b.endsAt) > now;
  const windowOpen = checkInWindowOpen(b.startsAt, b.endsAt, now);
  const fix = device.state.status === 'ready' ? device.state.fix : null;
  const actionError = firstError(checkIn.error) ?? firstError(cancel.error);

  return (
    <BrandThemeScope
      theme={brands.data?.find((x) => x.id === b.location.brandId)?.theme}
      className="flex-1"
    >
      <Stack.Screen options={{ title: confirmed ? 'Booking confirmed' : 'Booking' }} />
      <ScrollView contentContainerClassName="gap-5 p-4 pb-10">
        {confirmed ? (
          <View accessibilityRole="alert" className="rounded-2xl bg-success-soft p-4">
            <Text className="text-base font-semibold text-success">You’re booked in!</Text>
            <Text className="text-sm text-text">
              Show this QR code at the front desk, or check in on arrival.
            </Text>
          </View>
        ) : null}

        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-text-muted">Ref {b.code}</Text>
            <StatusPill status={b.status} />
          </View>
          <Text accessibilityRole="header" className="text-xl font-bold text-text">
            {b.space.name}
          </Text>
          <Text className="text-base text-text-muted">
            {b.location.name}, {b.location.city}
          </Text>
          <Text className="text-base text-text">
            {formatInZone(b.startsAt, tz, 'EEE, dd/MM/yyyy')}
          </Text>
          <Text className="text-base text-text">
            {formatInZone(b.startsAt, tz, TIME_FORMAT)} – {formatInZone(b.endsAt, tz, TIME_FORMAT)}{' '}
            ({b.location.city} time)
          </Text>
          {!sameOffset(tz, device_tz, b.startsAt) ? (
            <Text className="text-sm text-text-muted">
              {formatInZone(b.startsAt, device_tz, `EEE ${TIME_FORMAT}`)} on your phone
            </Text>
          ) : null}
        </Card>

        {upcoming && b.qrToken ? (
          <Card>
            <Text className="text-center text-sm font-semibold text-text">Check-in QR code</Text>
            <QrCode
              value={checkInPayload(b.id, b.qrToken)}
              accessibilityLabel={`Check-in QR code for booking ${b.code}`}
            />
            <Text className="text-center text-xs text-text-muted">
              Staff scan this at the front desk.
            </Text>
          </Card>
        ) : null}

        {b.status === 'checked_in' && b.checkedInAt ? (
          <Card>
            <Text className="text-base font-semibold text-primary">
              Checked in at {formatInZone(b.checkedInAt, tz, TIME_FORMAT)}
            </Text>
          </Card>
        ) : null}

        <Card>
          <PriceBreakdown {...b.price} />
        </Card>

        {actionError ? (
          <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-4">
            <Text className="text-sm text-danger">{actionError}</Text>
          </View>
        ) : null}

        {upcoming ? (
          <View className="gap-3">
            <Button
              label="Check in here"
              disabled={!windowOpen}
              loading={checkIn.isPending}
              accessibilityHint={
                windowOpen
                  ? 'Uses your location to confirm you are on site'
                  : `Opens ${CHECK_IN_OPENS_MIN} minutes before your booking`
              }
              onPress={() => {
                if (device.state.status !== 'ready') void device.refresh();
                checkIn.mutate({ id: b.id, device: fix });
              }}
            />
            {!windowOpen ? (
              <Text className="text-center text-xs text-text-muted">
                Check-in opens {CHECK_IN_OPENS_MIN} minutes before the start.
              </Text>
            ) : null}

            {canCancel(b.startsAt, now) ? (
              confirmingCancel ? (
                <Card>
                  <Text className="text-base font-semibold text-text">Cancel this booking?</Text>
                  <Text className="text-sm text-text-muted">The time slot will be released.</Text>
                  <Button
                    label="Yes, cancel booking"
                    loading={cancel.isPending}
                    onPress={() =>
                      cancel.mutate(b.id, { onSettled: () => setConfirmingCancel(false) })
                    }
                  />
                  <Button
                    label="Keep booking"
                    variant="ghost"
                    onPress={() => setConfirmingCancel(false)}
                  />
                </Card>
              ) : (
                <Button
                  label="Cancel booking"
                  variant="secondary"
                  onPress={() => setConfirmingCancel(true)}
                />
              )
            ) : (
              <Text className="text-center text-xs text-text-muted">
                Free cancellation has ended for this booking.
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </BrandThemeScope>
  );
}
