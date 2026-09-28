import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  readonly children: ReactNode;
  /** Wrap content in a ScrollView. Leave false for screens that own a FlatList. */
  readonly scroll?: boolean;
};

export function Screen({ children, scroll = false }: ScreenProps) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {scroll ? (
        <ScrollView contentContainerClassName="gap-5 px-4 pb-8 pt-4">{children}</ScrollView>
      ) : (
        <View className="flex-1 gap-5 px-4 pt-4">{children}</View>
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
