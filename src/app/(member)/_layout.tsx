import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppFrame } from '@/components/shell/app-frame';
import { MEMBER_NAV } from '@/components/shell/nav-items';
import { useMemberNavBrand } from '@/components/shell/use-nav-brand';
import { useLayout } from '@/lib/use-layout';
import { navColor, navPalette } from '@/theme/nav-palette';
import { colors } from '@/theme/tokens';

/**
 * Member area: tabs with detail screens pushed on top. Phones use the native
 * stack header for back navigation; wide screens hide it and show the
 * sidebar plus each page's breadcrumb header instead. Both take the colours of
 * the brand being viewed (a location or booking); brand-wide pages stay neutral.
 */
export default function MemberStackLayout() {
  const { wide } = useLayout();
  const brand = useMemberNavBrand();
  const palette = navPalette(brand?.theme);
  return (
    <AppFrame nav={MEMBER_NAV} brand={brand}>
      {/* Light status-bar icons over a branded header, dark over the light one. */}
      <StatusBar style={brand && !wide ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: !wide,
          headerTintColor: brand ? navColor(palette, 'text') : colors.primary,
          headerStyle: {
            backgroundColor: brand ? navColor(palette, 'background') : colors.surface,
          },
          headerTitleStyle: { color: brand ? navColor(palette, 'text') : colors.text },
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
