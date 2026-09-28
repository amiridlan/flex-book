import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Card({ children }: { readonly children: ReactNode }) {
  return (
    <View className="gap-2 rounded-2xl border border-border bg-surface p-4 lg:rounded-xl lg:p-5">
      {children}
    </View>
  );
}
