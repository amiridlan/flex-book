import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { Slot } from '@/api/schemas/availability';
import type { LocationDetail } from '@/api/schemas/location';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { useBrands, useCountries } from '@/features/catalog/use-catalog';
import { DateStrip } from '@/features/locations/components/date-strip';
import { DayPassPicker, SlotPicker } from '@/features/locations/components/slot-picker';
import { capacityLabel, priceLabel } from '@/features/locations/space-labels';
import { useAvailability, useLocation } from '@/features/locations/use-locations';
import { formatMoney } from '@/lib/money';
import {
  deviceTimeZone,
  formatInZone,
  longDateLabel,
  nextLocalDates,
  offsetLabel,
  sameOffset,
  TIME_FORMAT,
  WEEKDAY_NAMES,
  weekdayIndex,
  zonedInstant,
  type LocalDate,
} from '@/lib/time';
import { BrandThemeScope } from '@/theme/brand-theme';

const DAYS_AHEAD = 14;

export default function SpaceScreen() {
  const { id, spaceId } = useLocalSearchParams<{ id: string; spaceId: string }>();
  const location = useLocation(id);

  if (location.isPending) return <LoadingState label="Loading space…" />;
  if (location.isError) {
    return (
      <View className="p-4">
        <ErrorState error={location.error} onRetry={() => void location.refetch()} />
      </View>
    );
  }
  const space = location.data.spaces.find((s) => s.id === spaceId);
  if (!space) return <EmptyState title="Space not found" message="It may no longer be offered." />;

  return <SpacePicker location={location.data} spaceId={space.id} />;
}

function SpacePicker({ location, spaceId }: { location: LocationDetail; spaceId: string }) {
  const space = location.spaces.find((s) => s.id === spaceId);
  const brands = useBrands();
  const countries = useCountries();
  const dates = useMemo(() => nextLocalDates(location.timezone, DAYS_AHEAD), [location.timezone]);
  const [date, setDate] = useState<LocalDate>(() => dates[0] ?? '');
  const [selected, setSelected] = useState<Slot | null>(null);
  const availability = useAvailability(spaceId, date);
  const router = useRouter();

  if (!space) return null;

  const brand = brands.data?.find((b) => b.id === location.brandId);
  const country = countries.data?.find((c) => c.code === location.countryCode);
  const device = deviceTimeZone();
  // Offsets for the chosen day, not today: a DST change may sit in between.
  const middayOfDate = zonedInstant(date, '12:00', location.timezone);
  const zoneDiffers = !sameOffset(location.timezone, device, middayOfDate);
  const dstChange = offsetLabel(location.timezone, middayOfDate) !== offsetLabel(location.timezone);

  function chooseDate(next: LocalDate) {
    setDate(next);
    setSelected(null);
  }

  return (
    <BrandThemeScope theme={brand?.theme} className="flex-1">
      <Stack.Screen options={{ title: space.name }} />
      <ScrollView contentContainerClassName="w-full max-w-2xl self-center gap-5 p-4 pb-10 lg:p-8">
        <View className="gap-1">
          <Text accessibilityRole="header" className="text-2xl font-bold text-text">
            {space.name}
          </Text>
          <Text className="text-base text-text-muted">
            {location.name}, {location.city}
          </Text>
          <Text className="text-sm text-text-muted">
            {capacityLabel(space)} · {priceLabel(space)}
          </Text>
        </View>

        {zoneDiffers ? (
          <View accessibilityRole="text" className="rounded-xl bg-warning-soft p-3">
            <Text className="text-sm text-text">
              Times are in {location.city} time ({offsetLabel(location.timezone, middayOfDate)}).
              Your phone is on {offsetLabel(device, middayOfDate)}.
              {dstChange
                ? ` ${location.city} clocks change for daylight saving before this date.`
                : ''}
            </Text>
          </View>
        ) : null}

        <DateStrip dates={dates} selected={date} onSelect={chooseDate} />

        {availability.isPending ? (
          <LoadingState label="Checking availability…" />
        ) : availability.isError ? (
          <ErrorState error={availability.error} onRetry={() => void availability.refetch()} />
        ) : !availability.data.bookable ? (
          <Card>
            <Text className="text-base font-semibold text-text">Arranged with our team</Text>
            <Text className="text-sm text-text-muted">
              Private offices are set up to suit your team. Our community team will contact you to
              arrange a viewing.
            </Text>
          </Card>
        ) : !availability.data.open ? (
          <EmptyState
            title={`Closed on ${WEEKDAY_NAMES[weekdayIndex(date)]}`}
            message="Pick another day."
          />
        ) : space.rate.unit === 'day' && availability.data.slots[0] ? (
          <DayPassPicker
            slot={availability.data.slots[0]}
            timeZone={location.timezone}
            selected={selected?.startsAt === availability.data.slots[0].startsAt}
            onSelect={setSelected}
          />
        ) : availability.data.slots.every((s) => !s.available) ? (
          <EmptyState title="Fully booked" message="Try another day." />
        ) : (
          <SlotPicker
            slots={availability.data.slots}
            timeZone={location.timezone}
            selected={selected?.startsAt ?? null}
            onSelect={setSelected}
          />
        )}

        {selected ? (
          <Card>
            <Text className="text-sm font-semibold uppercase tracking-wide text-primary">
              Your selection
            </Text>
            <Text className="text-base font-semibold text-text">{longDateLabel(date)}</Text>
            <Text className="text-base text-text">
              {formatInZone(selected.startsAt, location.timezone, TIME_FORMAT)} –{' '}
              {formatInZone(selected.endsAt, location.timezone, TIME_FORMAT)} ({location.city} time)
            </Text>
            {zoneDiffers ? (
              <Text className="text-sm text-text-muted">
                That is {formatInZone(selected.startsAt, device, `EEE ${TIME_FORMAT}`)} –{' '}
                {formatInZone(selected.endsAt, device, TIME_FORMAT)} on your phone.
              </Text>
            ) : null}
            <Text className="text-base text-text">
              {formatMoney(space.rate.price)}
              {country?.tax.label ? ` + ${country.tax.label}` : ''}
            </Text>
            <Button
              label="Continue"
              onPress={() =>
                router.push({
                  pathname: '/locations/[id]/spaces/[spaceId]/review',
                  params: {
                    id: location.id,
                    spaceId,
                    startsAt: selected.startsAt,
                    endsAt: selected.endsAt,
                  },
                })
              }
            />
          </Card>
        ) : null}
      </ScrollView>
    </BrandThemeScope>
  );
}
