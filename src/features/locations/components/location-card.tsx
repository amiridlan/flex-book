import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { Brand } from '@/api/schemas/brand';
import type { Location } from '@/api/schemas/location';
import { Badge } from '@/components/ui/badge';
import { useLayout } from '@/lib/use-layout';
import { BrandThemeScope } from '@/theme/brand-theme';

type LocationCardProps = {
  readonly location: Location;
  readonly brand: Brand | undefined;
  /** When set, the card opens this route. */
  readonly href?: Href;
};

export function LocationCard({ location, brand, href }: LocationCardProps) {
  const { wide } = useLayout();
  const brandName = brand?.name ?? location.brandId;

  // Desktop: a brand-coloured cover band makes a grid of cards scannable at a glance.
  const body = wide ? (
    <>
      <View className="h-24 justify-between bg-primary px-5 py-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-on-primary/80">
          {brandName}
        </Text>
        <Text className="text-xl font-semibold text-on-primary">{location.city}</Text>
      </View>
      <View className="gap-2 p-5">
        <Text className="text-lg font-semibold text-text">{location.name}</Text>
        <Text className="text-sm leading-5 text-text-muted" numberOfLines={2}>
          {location.address}
        </Text>
        <Text className="text-xs text-text-muted">{location.amenities.join(' · ')}</Text>
      </View>
    </>
  ) : (
    <>
      <View className="flex-row items-center justify-between gap-2">
        <Badge label={brandName} />
        <Text className="text-xs text-text-muted">{location.city}</Text>
      </View>
      <View className="gap-1">
        <Text className="text-lg font-semibold text-text">{location.name}</Text>
        <Text className="text-sm text-text-muted" numberOfLines={2}>
          {location.address}
        </Text>
      </View>
      <Text className="text-xs text-text-muted">{location.amenities.join(' · ')}</Text>
    </>
  );

  const card = wide
    ? 'overflow-hidden rounded-xl border border-border bg-surface'
    : 'gap-3 rounded-2xl border border-border bg-surface p-4';

  return (
    <BrandThemeScope theme={brand?.theme}>
      {href ? (
        <Link href={href} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${location.name}, ${brandName}, ${location.city}`}
            className={`${card} hover:border-primary/50 hover:shadow-md active:bg-surface-muted`}
          >
            {body}
          </Pressable>
        </Link>
      ) : (
        <View className={card}>{body}</View>
      )}
    </BrandThemeScope>
  );
}
