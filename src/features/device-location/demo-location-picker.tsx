import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';

import { useDemoLocationStore } from './demo-location-store';
import { DEMO_PLACES } from './demo-places';

/** DEMO ONLY: lets the presenter "be" anywhere to show the distance rule live. */
export function DemoLocationPicker() {
  const override = useDemoLocationStore((s) => s.override);
  const setOverride = useDemoLocationStore((s) => s.setOverride);

  return (
    <Card>
      <Text accessibilityRole="header" className="text-base font-semibold text-text">
        Demo location
      </Text>
      <Text className="text-sm text-text-muted">
        Pretend the phone is somewhere else. The booking rule and check-in use this instead of GPS.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Real GPS" selected={override === null} onPress={() => setOverride(null)} />
        {DEMO_PLACES.map((place) => (
          <Chip
            key={place.id}
            label={place.label}
            selected={override?.id === place.id}
            onPress={() => setOverride(place)}
          />
        ))}
      </View>
    </Card>
  );
}
