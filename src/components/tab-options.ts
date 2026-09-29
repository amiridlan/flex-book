import type { BrandTheme } from '@/api/schemas/brand';
import { navColor, navPalette } from '@/theme/nav-palette';
import { colors } from '@/theme/tokens';

/**
 * Bottom tab bar for phones. On wide screens the tab bar is hidden and AppFrame's
 * sidebar takes over. With a brand, the bar takes the same colours as the sidebar;
 * without one it stays light.
 */
export function tabScreenOptions(brand?: BrandTheme) {
  if (!brand) {
    return {
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors['text-muted'],
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
    } as const;
  }
  const palette = navPalette(brand);
  return {
    headerShown: false,
    tabBarActiveTintColor: navColor(palette, 'text'),
    tabBarInactiveTintColor: navColor(palette, 'muted'),
    tabBarStyle: {
      backgroundColor: navColor(palette, 'background'),
      borderTopColor: navColor(palette, 'background'),
    },
  } as const;
}
