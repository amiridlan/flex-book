import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Maximum content width on large screens. `wide` suits grids and dashboards;
 * `narrow` suits detail pages and forms; `compact` suits sign-in.
 */
export type ScreenWidth = 'wide' | 'narrow' | 'compact';

export const SCREEN_WIDTH: Readonly<Record<ScreenWidth, string>> = {
  wide: 'max-w-6xl',
  narrow: 'max-w-2xl',
  compact: 'max-w-md',
};

type ScreenProps = {
  readonly children: ReactNode;
  /** Wrap content in a ScrollView. Leave false for screens that own a FlatList. */
  readonly scroll?: boolean;
  readonly width?: ScreenWidth;
};

export function Screen({ children, scroll = false, width = 'wide' }: ScreenProps) {
  const frame = `w-full self-center gap-5 px-4 lg:px-8 ${SCREEN_WIDTH[width]}`;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {scroll ? (
        <ScrollView contentContainerClassName={`${frame} pb-8 pt-4 lg:pt-8`}>{children}</ScrollView>
      ) : (
        <View className={`${frame} flex-1 pt-4 lg:pt-8`}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type ScreenHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="text-2xl font-bold text-text">
        {title}
      </Text>
      {subtitle ? <Text className="text-base text-text-muted">{subtitle}</Text> : null}
    </View>
  );
}
