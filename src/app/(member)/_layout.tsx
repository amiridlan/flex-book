import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/** Member area: the tab bar, with detail screens pushed on top of it. */
export default function MemberStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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
  );
}
