import { Tabs } from 'expo-router/js-tabs';

import { tabIcon } from '@/components/tab-icon';
import { tabScreenOptions } from '@/components/tab-options';
import { useLayout } from '@/lib/use-layout';

export default function StaffTabsLayout() {
  const { wide } = useLayout();
  return (
    <Tabs screenOptions={tabScreenOptions(wide)}>
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
  );
}
