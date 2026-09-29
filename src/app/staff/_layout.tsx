import { Tabs } from 'expo-router/js-tabs';

import { AppFrame } from '@/components/shell/app-frame';
import { STAFF_NAV } from '@/components/shell/nav-items';
import { useStaffNavBrand } from '@/components/shell/use-nav-brand';
import { tabIcon } from '@/components/tab-icon';
import { tabScreenOptions } from '@/components/tab-options';
import { useLayout } from '@/lib/use-layout';

export default function StaffTabsLayout() {
  const { wide } = useLayout();
  // Staff navigation wears the brand of the location the desk is working at.
  const brand = useStaffNavBrand();
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
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
        />
      </Tabs>
    </AppFrame>
  );
}
