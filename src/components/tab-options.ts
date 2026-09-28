import { colors } from '@/theme/tokens';

export const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors['text-muted'],
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
} as const;
