import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useLayout } from '@/lib/use-layout';

type ChipProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
};

/** A selectable filter chip. Announced as a radio-like toggle to screen readers. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-touch items-center justify-center rounded-full border px-4 ${
        selected
          ? 'border-primary bg-primary'
          : 'border-border bg-surface hover:border-primary/60 active:bg-surface-muted'
      }`}
    >
      <Text className={`text-sm font-semibold ${selected ? 'text-on-primary' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * A row of chips: scrolls sideways on phones (thumb-friendly), wraps onto
 * more lines on wide screens (mouse users can't swipe a hidden overflow).
 */
export function ChipGroup({ children }: { readonly children: ReactNode }) {
  const { wide } = useLayout();
  if (wide) return <View className="flex-1 flex-row flex-wrap gap-2">{children}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">{children}</View>
    </ScrollView>
  );
}
