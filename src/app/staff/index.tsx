import { Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { ROLE_LABELS } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { useBrands } from '@/features/catalog/use-catalog';
import { LocationCard } from '@/features/locations/components/location-card';
import { useLocations } from '@/features/locations/use-locations';

export default function StaffHomeScreen() {
  const user = useSessionStore((s) => s.user);
  const brands = useBrands();
  // No filters: the API returns only the locations this user is assigned to.
  const locations = useLocations();

  const count = locations.data?.meta.total ?? 0;

  return (
    <Screen scroll>
      <ScreenHeader
        title={`${ROLE_LABELS[user?.role ?? 'staff']} · ${user?.name.split(' ')[0] ?? ''}`}
        subtitle="Locations you manage"
      />

      {locations.isPending || brands.isPending ? (
        <LoadingState label="Loading your locations…" />
      ) : locations.isError || brands.isError ? (
        <ErrorState
          error={locations.error ?? brands.error}
          onRetry={() => {
            if (locations.isError) void locations.refetch();
            if (brands.isError) void brands.refetch();
          }}
        />
      ) : count === 0 ? (
        <EmptyState
          title="No locations assigned"
          message="Ask your brand admin to add you to a location."
        />
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-text-muted">
            {count === 1 ? '1 location' : `${count} locations`} in your scope
          </Text>
          {locations.data.data.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              brand={brands.data.find((b) => b.id === location.brandId)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
