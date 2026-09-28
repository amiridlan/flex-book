import { ActivityIndicator, Text, View } from 'react-native';

import { errorMessage } from '@/api/client/api-error';
import { colors } from '@/theme/tokens';

import { Button } from './button';

export function LoadingState({ label = 'Loading…' }: { readonly label?: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className="items-center justify-center gap-3 py-12"
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="text-sm text-text-muted">{label}</Text>
    </View>
  );
}

type EmptyStateProps = {
  readonly title: string;
  readonly message?: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View className="items-center gap-2 px-6 py-12">
      <Text className="text-center text-lg font-semibold text-text">{title}</Text>
      {message ? <Text className="text-center text-sm text-text-muted">{message}</Text> : null}
    </View>
  );
}

type ErrorStateProps = {
  readonly error: unknown;
  readonly onRetry: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" className="items-center gap-4 rounded-2xl bg-danger-soft p-6">
      <Text className="text-center text-base font-semibold text-danger">Couldn’t load this</Text>
      <Text className="text-center text-sm text-text">{errorMessage(error)}</Text>
      <Button label="Retry" variant="secondary" onPress={onRetry} />
    </View>
  );
}
