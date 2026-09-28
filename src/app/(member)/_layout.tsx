import { Tabs } from 'expo-router/js-tabs';

import { tabIcon } from '@/components/tab-icon';
import { TAB_SCREEN_OPTIONS } from '@/components/tab-options';

export default function MemberTabsLayout() {
  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: tabIcon('search') }} />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tabs>
  );
}
