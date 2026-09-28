import { Text, View } from 'react-native';

import type { Brand } from '@/api/schemas/brand';
import type { Location } from '@/api/schemas/location';
import { Badge } from '@/components/ui/badge';
import { BrandThemeScope } from '@/theme/brand-theme';

type LocationCardProps = {
  readonly location: Location;
  readonly brand: Brand | undefined;
};

export function LocationCard({ location, brand }: LocationCardProps) {
  return (
    <BrandThemeScope
      theme={brand?.theme}
      className="gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Badge label={brand?.name ?? location.brandId} />
        <Text className="text-xs text-text-muted">{location.city}</Text>
      </View>
      <View className="gap-1">
        <Text className="text-lg font-semibold text-text">{location.name}</Text>
        <Text className="text-sm text-text-muted" numberOfLines={2}>
          {location.address}
        </Text>
      </View>
      <Text className="text-xs text-text-muted">{location.amenities.join(' · ')}</Text>
    </BrandThemeScope>
  );
}
