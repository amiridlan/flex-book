import { Tabs } from 'expo-router/js-tabs';

import { tabIcon } from '@/components/tab-icon';
import { tabScreenOptions } from '@/components/tab-options';
import { useLayout } from '@/lib/use-layout';

export default function MemberTabsLayout() {
  const { wide } = useLayout();
  return (
    <Tabs screenOptions={tabScreenOptions(wide)}>
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
