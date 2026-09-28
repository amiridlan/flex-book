import { colors } from '@/theme/tokens';

/**
 * Tab navigator options. Narrow screens: bottom tab bar. Wide screens (laptop,
 * desktop browser): a labelled sidebar on the left.
 */
export function tabScreenOptions(wide: boolean) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors['text-muted'],
    tabBarPosition: wide ? 'left' : 'bottom',
    tabBarVariant: wide ? 'material' : 'uikit',
    tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
    tabBarStyle: wide
      ? {
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
          minWidth: 220,
          paddingTop: 24,
        }
      : { backgroundColor: colors.surface, borderTopColor: colors.border },
  } as const;
}
