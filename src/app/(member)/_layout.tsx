import { Stack } from 'expo-router';

import { AppFrame } from '@/components/shell/app-frame';
import { MEMBER_NAV } from '@/components/shell/nav-items';
import { useLayout } from '@/lib/use-layout';
import { colors } from '@/theme/tokens';

/**
 * Member area: tabs with detail screens pushed on top. Phones use the native
 * stack header for back navigation; wide screens hide it and show the
 * sidebar plus each page's breadcrumb header instead.
 */
export default function MemberStackLayout() {
  const { wide } = useLayout();
  return (
    <AppFrame nav={MEMBER_NAV}>
      <Stack
        screenOptions={{
          headerShown: !wide,
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text },
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="locations/[id]/index" options={{ title: 'Location' }} />
        <Stack.Screen
          name="locations/[id]/spaces/[spaceId]/index"
          options={{ title: 'Choose a time' }}
        />
        <Stack.Screen
          name="locations/[id]/spaces/[spaceId]/review"
          options={{ title: 'Review booking' }}
        />
        <Stack.Screen name="bookings/[id]" options={{ title: 'Booking' }} />
      </Stack>
    </AppFrame>
  );
}
