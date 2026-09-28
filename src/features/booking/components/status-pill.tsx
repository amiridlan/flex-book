import { Text, View } from 'react-native';

import type { BookingStatus } from '@/api/schemas/booking';

const STYLES: Readonly<Record<BookingStatus, { label: string; box: string; text: string }>> = {
  confirmed: { label: 'Confirmed', box: 'bg-success-soft', text: 'text-success' },
  checked_in: { label: 'Checked in', box: 'bg-primary-soft', text: 'text-primary' },
  completed: { label: 'Completed', box: 'bg-surface-muted', text: 'text-text-muted' },
  cancelled: { label: 'Cancelled', box: 'bg-surface-muted', text: 'text-text-muted' },
  no_show: { label: 'No-show', box: 'bg-danger-soft', text: 'text-danger' },
};

export function StatusPill({ status }: { readonly status: BookingStatus }) {
  const style = STYLES[status];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${style.box}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
    </View>
  );
}
