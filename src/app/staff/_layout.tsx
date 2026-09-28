import { Tabs } from 'expo-router/js-tabs';

import { tabIcon } from '@/components/tab-icon';
import { TAB_SCREEN_OPTIONS } from '@/components/tab-options';

export default function StaffTabsLayout() {
  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
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
