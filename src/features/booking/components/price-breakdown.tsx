import { Text, View } from 'react-native';

import type { Money } from '@/api/schemas/common';
import { formatMoney } from '@/lib/money';

type PriceBreakdownProps = {
  readonly subtotal: Money;
  readonly tax: Money;
  readonly total: Money;
  readonly taxLabel: string | null;
  readonly taxRateBp: number;
};

export function PriceBreakdown({ subtotal, tax, total, taxLabel, taxRateBp }: PriceBreakdownProps) {
  return (
    <View className="gap-2">
      <Line label="Subtotal" value={formatMoney(subtotal)} />
      {taxLabel ? (
        <Line label={`${taxLabel} ${taxRateBp / 100}%`} value={formatMoney(tax)} />
      ) : null}
      <View className="h-px bg-border" />
      <Line label="Total" value={formatMoney(total)} strong />
    </View>
  );
}

function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const text = strong ? 'text-base font-bold text-text' : 'text-sm text-text-muted';
  return (
    <View className="flex-row justify-between">
      <Text className={text}>{label}</Text>
      <Text className={text}>{value}</Text>
    </View>
  );
}
