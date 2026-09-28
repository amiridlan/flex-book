import { colors } from '@/theme/tokens';

/** Bottom tab bar for phones. On wide screens the tab bar is hidden and AppFrame's sidebar takes over. */
export const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors['text-muted'],
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
} as const;
