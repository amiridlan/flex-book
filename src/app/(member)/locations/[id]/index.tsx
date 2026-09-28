import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { useBrands, useCountries } from '@/features/catalog/use-catalog';
import { LocalTimeCard } from '@/features/locations/components/local-time-card';
import { SpaceRow } from '@/features/locations/components/space-row';
import { hoursLabel } from '@/features/locations/opening-hours';
import { useLocation } from '@/features/locations/use-locations';
import { useLayout } from '@/lib/use-layout';
import { todayIn, WEEKDAY_NAMES, weekdayIndex } from '@/lib/time';
import { BrandThemeScope } from '@/theme/brand-theme';

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const location = useLocation(id);
  const { wide } = useLayout();
  const brands = useBrands();
  const countries = useCountries();

  if (location.isPending) return <LoadingState label="Loading location…" />;
  if (location.isError) {
    return (
      <View className="p-4">
        <ErrorState error={location.error} onRetry={() => void location.refetch()} />
      </View>
    );
  }

  const data = location.data;
  const brand = brands.data?.find((b) => b.id === data.brandId);
  const country = countries.data?.find((c) => c.code === data.countryCode);
  const today = weekdayIndex(todayIn(data.timezone));

  const header = (
    <>
      <View className="gap-2">
        <Badge label={brand?.name ?? data.brandId} />
        <Text accessibilityRole="header" className="text-2xl font-bold text-text">
          {data.name}
        </Text>
        <Text className="text-base text-text-muted">{data.address}</Text>
        <Text className="text-sm text-text-muted">
          {data.city}, {country?.name ?? data.countryCode}
        </Text>
      </View>
    </>
  );
  const localTime = <LocalTimeCard location={data} />;
  const spaces = (
    <>
      <View className="gap-3">
        <Text accessibilityRole="header" className="text-lg font-semibold text-text">
          Book a space
        </Text>
        {data.spaces.length === 0 ? (
          <EmptyState title="Nothing to book here yet" />
        ) : (
          data.spaces.map((space) => (
            <SpaceRow
              key={space.id}
              space={space}
              country={country}
              href={{
                pathname: '/locations/[id]/spaces/[spaceId]',
                params: { id: data.id, spaceId: space.id },
              }}
            />
          ))
        )}
      </View>
    </>
  );
  const details = (
    <>
      <View className="gap-2">
        <Text accessibilityRole="header" className="text-lg font-semibold text-text">
          Opening hours
        </Text>
        <View className="gap-1 rounded-2xl border border-border bg-surface p-4">
          {data.openingHours.map((hours, index) => (
            <View key={WEEKDAY_NAMES[index]} className="flex-row justify-between py-1">
              <Text
                className={`text-sm ${index === today ? 'font-bold text-text' : 'text-text-muted'}`}
              >
                {WEEKDAY_NAMES[index]}
                {index === today ? ' (today)' : ''}
              </Text>
              <Text
                className={`text-sm ${index === today ? 'font-bold text-text' : 'text-text-muted'}`}
              >
                {hoursLabel(hours)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text accessibilityRole="header" className="text-lg font-semibold text-text">
          Amenities
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {data.amenities.map((amenity) => (
            <View key={amenity} className="rounded-full bg-surface-muted px-3 py-1">
              <Text className="text-sm text-text">{amenity}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <BrandThemeScope theme={brand?.theme} className="flex-1">
      <Stack.Screen options={{ title: data.name }} />
      <ScrollView contentContainerClassName="w-full max-w-6xl self-center gap-5 p-4 pb-10 lg:p-8">
        {wide ? (
          // Laptop: details on the left, spaces to book on the right.
          <View className="flex-row items-start gap-8">
            <View className="w-2/5 gap-5">
              {header}
              {localTime}
              {details}
            </View>
            <View className="flex-1 gap-3">{spaces}</View>
          </View>
        ) : (
          // Phone: booking comes before opening hours and amenities.
          <>
            {header}
            {localTime}
            {spaces}
            {details}
          </>
        )}
      </ScrollView>
    </BrandThemeScope>
  );
}
