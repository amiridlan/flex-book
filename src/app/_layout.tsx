import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppErrorBoundary } from '@/components/error-boundary';
import { isStaffArea } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { queryClient } from '@/lib/query-client';

export { AppErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}

/**
 * Route guards. Each area is only mounted while its guard is true; when the
 * session changes, Expo Router moves the user to the first allowed screen.
 * This shapes the UI only: the API enforces the same rules on every request.
 */
function RootNavigator() {
  const user = useSessionStore((s) => s.user);
  const staff = isStaffArea(user);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={user !== null && !staff}>
        <Stack.Screen name="(member)" />
      </Stack.Protected>
      <Stack.Protected guard={user !== null && staff}>
        <Stack.Screen name="staff" />
      </Stack.Protected>
    </Stack>
  );
}
