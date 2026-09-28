import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { Country } from '@/api/schemas/country';
import type { Space } from '@/api/schemas/location';

import { capacityLabel, priceLabel, SPACE_TYPE_LABELS } from '../space-labels';

type SpaceRowProps = {
  readonly space: Space;
  readonly country: Country | undefined;
  readonly href: Href;
};

export function SpaceRow({ space, country, href }: SpaceRowProps) {
  const taxNote = country?.tax.label ? `excl. ${country.tax.label}` : 'no tax';
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${space.name}, ${priceLabel(space)}, ${capacityLabel(space)}`}
        className="min-h-touch gap-1 rounded-2xl border border-border bg-surface p-4 active:bg-surface-muted"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
              {SPACE_TYPE_LABELS[space.type]}
            </Text>
            <Text className="text-base font-semibold text-text">{space.name}</Text>
            <Text className="text-sm text-text-muted">{capacityLabel(space)}</Text>
          </View>
          <View className="items-end gap-1">
            <Text className="text-base font-semibold text-text">{priceLabel(space)}</Text>
            <Text className="text-xs text-text-muted">{taxNote}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
