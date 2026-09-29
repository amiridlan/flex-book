import { Tabs } from 'expo-router/js-tabs';

import { AppFrame } from '@/components/shell/app-frame';
import { STAFF_NAV } from '@/components/shell/nav-items';
import { useStaffNavBrand } from '@/components/shell/use-nav-brand';
import { tabIcon } from '@/components/tab-icon';
import { tabScreenOptions } from '@/components/tab-options';
import { hasPermission } from '@/features/auth/permissions';
import { useSessionStore } from '@/features/auth/session-store';
import { useLayout } from '@/lib/use-layout';

export default function StaffTabsLayout() {
  const { wide } = useLayout();
  // Staff navigation wears the brand of the location the desk is working at.
  const brand = useStaffNavBrand();
  const user = useSessionStore((s) => s.user);
  return (
    <AppFrame nav={STAFF_NAV} brand={brand}>
      <Tabs screenOptions={tabScreenOptions(brand?.theme)} tabBar={wide ? () => null : undefined}>
        <Tabs.Screen
          name="index"
          options={{ title: 'Today', tabBarIcon: tabIcon('today-outline') }}
        />
        <Tabs.Screen
          name="scan"
          options={{ title: 'Scan', tabBarIcon: tabIcon('qr-code-outline') }}
        />
        <Tabs.Screen
          name="walk-in"
          options={{ title: 'Walk-in', tabBarIcon: tabIcon('person-add-outline') }}
        />
        {/* Super admin screens: hidden from other roles (the server refuses them too). */}
        <Tabs.Screen
          name="users"
          options={{
            title: 'People',
            tabBarIcon: tabIcon('people-outline'),
            href: hasPermission(user, 'users.manage') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarIcon: tabIcon('document-text-outline'),
            href: hasPermission(user, 'audit.view') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
        />
      </Tabs>
    </AppFrame>
  );
}
