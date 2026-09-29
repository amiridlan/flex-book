import { ScrollView, View } from 'react-native';

import type { Location } from '@/api/schemas/location';
import { Chip } from '@/components/ui/chip';

type LocationSwitcherProps = {
  readonly locations: readonly Location[];
  readonly currentId: string | undefined;
  readonly onSelect: (id: string) => void;
  /** Admins: an "All locations" chip first. */
  readonly overview?: { readonly active: boolean; readonly onSelect: () => void };
};

/** Shown only to staff with more than one location in scope. */
export function LocationSwitcher({
  locations,
  currentId,
  onSelect,
  overview,
}: LocationSwitcherProps) {
  if (locations.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {overview ? (
          <Chip label="All locations" selected={overview.active} onPress={overview.onSelect} />
        ) : null}
        {locations.map((location) => (
          <Chip
            key={location.id}
            label={`${location.name} · ${location.city}`}
            selected={!overview?.active && location.id === currentId}
            onPress={() => onSelect(location.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
