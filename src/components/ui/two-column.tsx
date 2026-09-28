import type { ReactNode } from 'react';
import { View } from 'react-native';

type TwoColumnProps = {
  /** The task itself: what the user reads and fills in. */
  readonly main: ReactNode;
  /** Summary and the primary action, kept in view while the main column scrolls. */
  readonly aside: ReactNode;
  /** Pin the aside while the page scrolls (web only; native has no sticky). */
  readonly sticky?: boolean;
};

/**
 * Desktop-only split: fluid main column, 360px aside on the right. Screens
 * choose it when `useLayout().wide` is true and keep their own phone order.
 */
export function TwoColumn({ main, aside, sticky = true }: TwoColumnProps) {
  return (
    <View className="flex-row items-start gap-8">
      <View className="flex-1 gap-5">{main}</View>
      <View className={`w-[360px] gap-4 ${sticky ? 'web:sticky web:top-6' : ''}`}>{aside}</View>
    </View>
  );
}
