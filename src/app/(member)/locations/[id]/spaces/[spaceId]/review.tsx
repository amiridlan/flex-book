import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { firstError } from '@/api/client/api-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { TwoColumn } from '@/components/ui/two-column';
import { checkBookingRule, ruleMessage, CANCELLATION_CUTOFF_MIN } from '@/domain/booking-rules';
import { LocationCheckCard } from '@/features/booking/components/location-check-card';
import { PriceBreakdown } from '@/features/booking/components/price-breakdown';
import { useCreateBooking } from '@/features/booking/use-bookings';
import { useBrands, useCountries } from '@/features/catalog/use-catalog';
import { useDeviceLocation } from '@/features/device-location/use-device-location';
import { useLocation } from '@/features/locations/use-locations';
import { taxMinor } from '@/lib/money';
import { formatInZone, longDateLabel, TIME_FORMAT } from '@/lib/time';
import { useLayout } from '@/lib/use-layout';
import { BrandThemeScope } from '@/theme/brand-theme';

type Params = { id: string; spaceId: string; startsAt: string; endsAt: string };

export default function BookingReviewScreen() {
  const { id, spaceId, startsAt, endsAt } = useLocalSearchParams<Params>();
  const router = useRouter();
  const location = useLocation(id);
  const brands = useBrands();
  const countries = useCountries();
  const device = useDeviceLocation();
  const createBooking = useCreateBooking();
  const { wide } = useLayout();

  if (location.isPending || countries.isPending) return <LoadingState />;
  if (location.isError || countries.isError) {
    return (
      <View className="p-4">
        <ErrorState
          error={location.error ?? countries.error}
          onRetry={() => {
            void location.refetch();
            void countries.refetch();
          }}
        />
      </View>
    );
  }

  const data = location.data;
  const space = data.spaces.find((s) => s.id === spaceId);
  const country = countries.data.find((c) => c.code === data.countryCode);
  if (!space || !country || !startsAt || !endsAt) {
    return (
      <EmptyState title="This booking can’t be shown" message="Go back and pick a time again." />
    );
  }

  const date = formatInZone(startsAt, data.timezone, 'yyyy-MM-dd');
  const fix = device.state.status === 'ready' ? device.state.fix : null;
  const rule = device.state.status === 'ready' ? checkBookingRule(data, date, fix) : null;
  const failure = rule && !rule.ok ? ruleMessage(rule, country.name) : null;

  const hours =
    space.rate.unit === 'hour' ? (Date.parse(endsAt) - Date.parse(startsAt)) / 3_600_000 : 1;
  const subtotal = space.rate.price.amountMinor * hours;
  const tax = taxMinor(subtotal, country.tax.rateBp);
  const currency = space.rate.price.currency;

  const serverFieldError = firstError(createBooking.error);

  function confirm() {
    createBooking.mutate(
      { spaceId, startsAt, endsAt, device: fix },
      {
        onSuccess: (booking) =>
          router.replace({
            pathname: '/bookings/[id]',
            params: { id: booking.id, confirmed: '1' },
          }),
      },
    );
  }

  const summary = (
    <Card>
      <Text className="text-sm font-semibold uppercase tracking-wide text-primary">
        {data.name}, {data.city}
      </Text>
      <Text className="text-lg font-bold text-text">{space.name}</Text>
      <Text className="text-base text-text">{longDateLabel(date)}</Text>
      <Text className="text-base text-text">
        {formatInZone(startsAt, data.timezone, TIME_FORMAT)} –{' '}
        {formatInZone(endsAt, data.timezone, TIME_FORMAT)} ({data.city} time)
      </Text>
    </Card>
  );

  const price = (
    <Card>
      <PriceBreakdown
        subtotal={{ amountMinor: subtotal, currency }}
        tax={{ amountMinor: tax, currency }}
        total={{ amountMinor: subtotal + tax, currency }}
        taxLabel={country.tax.label}
        taxRateBp={country.tax.rateBp}
      />
      <Text className="text-xs text-text-muted">
        Demo: no payment is taken. Free cancellation up to {CANCELLATION_CUTOFF_MIN} minutes before
        the start.
      </Text>
    </Card>
  );

  const locationCheck = (
    <LocationCheckCard
      state={device.state}
      result={rule}
      failureMessage={failure}
      onAllow={() => void device.requestPermission()}
      onRetry={() => void device.refresh()}
      onOpenSettings={device.openSettings}
    />
  );

  const submit = (
    <>
      {serverFieldError ? (
        <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-4">
          <Text className="text-sm text-danger">{serverFieldError}</Text>
        </View>
      ) : null}

      <Button
        label="Confirm booking"
        onPress={confirm}
        loading={createBooking.isPending}
        disabled={!rule?.ok}
        accessibilityHint={rule?.ok ? undefined : 'Available once your location check passes'}
      />
    </>
  );

  return (
    <BrandThemeScope
      theme={brands.data?.find((b) => b.id === data.brandId)?.theme}
      className="flex-1"
    >
      <Stack.Screen options={{ title: 'Review booking' }} />
      <ScrollView contentContainerClassName="w-full max-w-2xl self-center gap-5 p-4 pb-10 lg:max-w-6xl lg:p-8">
        {wide ? (
          <>
            <PageHeader
              title="Review booking"
              subtitle="Check the details, then confirm. Your location is checked before booking."
              breadcrumbs={[
                { label: 'Explore', href: '/' },
                {
                  label: data.name,
                  href: { pathname: '/locations/[id]', params: { id: data.id } },
                },
                {
                  label: space.name,
                  href: {
                    pathname: '/locations/[id]/spaces/[spaceId]',
                    params: { id: data.id, spaceId: space.id },
                  },
                },
                { label: 'Review' },
              ]}
            />
            <TwoColumn
              main={
                <>
                  {summary}
                  {locationCheck}
                </>
              }
              aside={
                <>
                  {price}
                  {submit}
                </>
              }
            />
          </>
        ) : (
          <>
            {summary}
            {price}
            {locationCheck}
            {submit}
          </>
        )}
      </ScrollView>
    </BrandThemeScope>
  );
}
