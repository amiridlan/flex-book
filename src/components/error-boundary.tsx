import type { ErrorBoundaryProps } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './ui/button';

/** Root render-error fallback. Expo Router uses the `ErrorBoundary` export of a route file. */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error(error);
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View accessibilityRole="alert" className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-center text-xl font-bold text-text">Something went wrong</Text>
        <Text className="text-center text-base text-text-muted">
          The app hit an unexpected problem. Try again, and if it keeps happening, restart the app.
        </Text>
        <Button label="Try again" onPress={() => void retry()} />
      </View>
    </SafeAreaView>
  );
}
