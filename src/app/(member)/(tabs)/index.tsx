import { useState } from 'react';
import { Text, View } from 'react-native';

import type { BrandId } from '@/api/schemas/brand';
import type { CountryCode } from '@/api/schemas/common';
import { CardGrid } from '@/components/ui/card-grid';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { useSessionStore } from '@/features/auth/session-store';
import { useBrands, useCountries } from '@/features/catalog/use-catalog';
import { LocationCard } from '@/features/locations/components/location-card';
import { useLocations } from '@/features/locations/use-locations';
import { useLayout } from '@/lib/use-layout';

/** Until device location lands, members start in Malaysia. */
const DEFAULT_COUNTRY: CountryCode = 'MY';

export default function ExploreScreen() {
  const user = useSessionStore((s) => s.user);
  const { wide } = useLayout();
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [brand, setBrand] = useState<BrandId | undefined>(undefined);

  const countries = useCountries();
  const brands = useBrands();
  const locations = useLocations({ country, brand });

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const countryName = countries.data?.find((c) => c.code === country)?.name ?? country;

  const countryChips = countries.isError ? (
    <ErrorState error={countries.error} onRetry={() => void countries.refetch()} />
  ) : (
    <ChipGroup>
      {(countries.data ?? []).map((c) => (
        <Chip
          key={c.code}
          label={c.name}
          selected={c.code === country}
          onPress={() => setCountry(c.code)}
        />
      ))}
    </ChipGroup>
  );

  const brandChips = (
    <ChipGroup>
      <Chip label="All brands" selected={brand === undefined} onPress={() => setBrand(undefined)} />
      {(brands.data ?? []).map((b) => (
        <Chip key={b.id} label={b.name} selected={b.id === brand} onPress={() => setBrand(b.id)} />
      ))}
    </ChipGroup>
  );

  const count = locations.data?.meta.total;

  return (
    <Screen scroll>
      {wide ? (
        <>
          <PageHeader
            title="Find a workspace"
            subtitle={`Welcome back, ${firstName}. Book a desk or room at any brand, in any country.`}
          />
          {/* Desktop filter toolbar: labels on the left, options wrap on the right. */}
          <View className="gap-4 rounded-xl border border-border bg-surface p-5">
            <View className="flex-row items-center gap-4">
              <Text className="w-20 text-sm font-semibold text-text-muted">Country</Text>
              {countryChips}
            </View>
            <View className="h-px bg-border" />
            <View className="flex-row items-center gap-4">
              <Text className="w-20 text-sm font-semibold text-text-muted">Brand</Text>
              {brandChips}
            </View>
          </View>
        </>
      ) : (
        <>
          <ScreenHeader title={`Hi ${firstName}`} subtitle="Find a space to work today." />
          <View className="gap-2">
            <Text className="text-sm font-semibold text-text-muted">Country</Text>
            {countryChips}
          </View>
          <View className="gap-2">
            <Text className="text-sm font-semibold text-text-muted">Brand</Text>
            {brandChips}
          </View>
        </>
      )}

      <View className="gap-3">
        <View className="flex-row items-baseline justify-between">
          <Text accessibilityRole="header" className="text-lg font-semibold text-text">
            Spaces in {countryName}
          </Text>
          {wide && count !== undefined ? (
            <Text className="text-sm text-text-muted">
              {count === 1 ? '1 location' : `${count} locations`}
            </Text>
          ) : null}
        </View>
        {locations.isPending || brands.isPending ? (
          <LoadingState label="Finding spaces…" />
        ) : locations.isError || brands.isError ? (
          <ErrorState
            error={locations.error ?? brands.error}
            onRetry={() => {
              if (locations.isError) void locations.refetch();
              if (brands.isError) void brands.refetch();
            }}
          />
        ) : locations.data.data.length === 0 ? (
          <EmptyState title="No spaces here yet" message="Try another country or brand." />
        ) : (
          <CardGrid>
            {locations.data.data.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                brand={brands.data.find((b) => b.id === location.brandId)}
                href={{ pathname: '/locations/[id]', params: { id: location.id } }}
              />
            ))}
          </CardGrid>
        )}
      </View>
    </Screen>
  );
}
