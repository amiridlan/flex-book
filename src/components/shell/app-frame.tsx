import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Brand } from '@/api/schemas/brand';
import { ROLE_LABELS } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { useSignOut } from '@/features/auth/use-auth';
import { useBrands } from '@/features/catalog/use-catalog';
import { useLayout } from '@/lib/use-layout';
import { navColor, navPalette, navVars } from '@/theme/nav-palette';

import { BrandLabel, useBackgroundWipe } from './brand-transition';
import type { NavItem } from './nav-items';

type AppFrameProps = {
  readonly nav: readonly NavItem[];
  /** Brand whose colours the sidebar takes; undefined keeps the neutral slate. */
  readonly brand?: Brand;
  readonly children: ReactNode;
};

/**
 * Desktop app shell: a fixed 240 px dark sidebar beside the page. On phones it
 * renders only the children. The children keep the same position in the tree
 * either way, so resizing the window never resets navigation state.
 */
export function AppFrame({ nav, brand, children }: AppFrameProps) {
  const { wide } = useLayout();
  return (
    <View className="flex-1 flex-row bg-background">
      {wide ? <Sidebar nav={nav} brand={brand} /> : null}
      <View className="flex-1">{children}</View>
    </View>
  );
}

function Sidebar({ nav, brand }: { readonly nav: readonly NavItem[]; readonly brand?: Brand }) {
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const signOut = useSignOut();
  const brands = useBrands();
  const palette = navPalette(brand?.theme);
  // Brand colours are API data, so the animated background is an inline colour, not a class.
  const { paintedBackground, overlay } = useBackgroundWipe(palette.background);

  return (
    // The wrapper re-points the sidebar-* tokens, so every class below takes the brand's colours.
    <View style={brand ? navVars(palette) : undefined} className="flex-row">
      <View
        role="navigation"
        accessibilityLabel="Main"
        style={{ backgroundColor: paintedBackground }}
        className="w-60 justify-between px-3 pb-5 pt-6"
      >
        {overlay}
        <View className="gap-8">
          <View className="flex-row items-center gap-3 px-3">
            <View
              className="flex-row gap-1"
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {(brands.data ?? []).map((brand) => (
                // Brand colours are API data, so they are applied inline rather than as tokens.
                <View
                  key={brand.id}
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: brand.theme.primary }}
                />
              ))}
            </View>
            <View>
              <Text className="text-lg font-bold text-sidebar-text">FlexiSpace</Text>
              <BrandLabel
                name={brand?.name ?? 'All brands'}
                className="text-xs text-sidebar-muted"
              />
            </View>
          </View>

          <View className="gap-1">
            {nav.map((item) => {
              const active = item.matches(pathname);
              return (
                <Link key={item.label} href={item.href} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                    className={`relative min-h-touch flex-row items-center gap-3 rounded-lg px-3 ${
                      active ? 'bg-sidebar-active' : 'hover:bg-sidebar-active/60'
                    }`}
                  >
                    <View
                      className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-full ${
                        active ? 'bg-sidebar-indicator' : 'bg-transparent'
                      }`}
                    />
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={navColor(palette, active ? 'text' : 'muted')}
                    />
                    <Text
                      className={`text-[15px] ${
                        active ? 'font-semibold text-sidebar-text' : 'text-sidebar-muted'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>

        <View className="gap-4">
          <Link href="/docs" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Documentation"
              className="min-h-touch flex-row items-center gap-3 rounded-lg px-3 hover:bg-sidebar-active/60"
            >
              <Ionicons name="book-outline" size={20} color={navColor(palette, 'muted')} />
              <Text className="text-[15px] text-sidebar-muted">Documentation</Text>
            </Pressable>
          </Link>
          {user ? (
            <View className="gap-1 border-t border-sidebar-active px-3 pt-4">
              <Text className="text-sm font-semibold text-sidebar-text" numberOfLines={1}>
                {user.name}
              </Text>
              <Text className="text-xs text-sidebar-muted" numberOfLines={1}>
                {ROLE_LABELS[user.role]} · {user.email}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                onPress={() => signOut.mutate()}
                className="mt-2 self-start rounded-md py-1"
              >
                <Text className="text-sm text-sidebar-muted hover:text-sidebar-text">Sign out</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
