import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ROLE_LABELS } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { useSignOut } from '@/features/auth/use-auth';
import { useBrands } from '@/features/catalog/use-catalog';
import { useLayout } from '@/lib/use-layout';
import { colors } from '@/theme/tokens';

import type { NavItem } from './nav-items';

type AppFrameProps = {
  readonly nav: readonly NavItem[];
  readonly children: ReactNode;
};

/**
 * Desktop app shell: a fixed 240 px dark sidebar beside the page. On phones it
 * renders only the children. The children keep the same position in the tree
 * either way, so resizing the window never resets navigation state.
 */
export function AppFrame({ nav, children }: AppFrameProps) {
  const { wide } = useLayout();
  return (
    <View className="flex-1 flex-row bg-background">
      {wide ? <Sidebar nav={nav} /> : null}
      <View className="flex-1">{children}</View>
    </View>
  );
}

function Sidebar({ nav }: { readonly nav: readonly NavItem[] }) {
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const signOut = useSignOut();
  const brands = useBrands();

  return (
    <View
      role="navigation"
      accessibilityLabel="Main"
      className="w-60 justify-between bg-sidebar px-3 pb-5 pt-6"
    >
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
          <Text className="text-lg font-bold text-white">FlexiSpace</Text>
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
                      active ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? colors['sidebar-text'] : colors['sidebar-muted']}
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
            <Ionicons name="book-outline" size={20} color={colors['sidebar-muted']} />
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
              <Text className="text-sm text-sidebar-muted hover:text-white">Sign out</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
