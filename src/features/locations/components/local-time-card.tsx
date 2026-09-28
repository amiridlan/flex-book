import { Text, View } from 'react-native';

import type { Location } from '@/api/schemas/location';
import { deviceTimeZone, formatInZone, offsetLabel, sameOffset, TIME_FORMAT } from '@/lib/time';
import { useNow } from '@/lib/use-now';

import { openStatus } from '../opening-hours';

/** Live local clock for a location, with its UTC offset and open/closed status. */
export function LocalTimeCard({ location }: { readonly location: Location }) {
  const now = useNow();
  const status = openStatus(location, now);
  const device = deviceTimeZone();
  const differs = !sameOffset(location.timezone, device, now);

  return (
    <View className="gap-2 rounded-2xl bg-primary-soft p-4">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-sm font-semibold text-primary">Local time in {location.city}</Text>
        <Text className="text-xs font-semibold text-primary">
          {offsetLabel(location.timezone, now)}
        </Text>
      </View>
      <Text className="text-2xl font-bold text-text">
        {formatInZone(now, location.timezone, TIME_FORMAT)}
      </Text>
      <Text className={`text-sm font-semibold ${status.open ? 'text-success' : 'text-danger'}`}>
        {status.open ? `Open now · closes ${status.closes}` : 'Closed now'}
      </Text>
      {differs ? (
        <Text className="text-xs text-text-muted">
          Your phone is on {offsetLabel(device, now)} ({formatInZone(now, device, TIME_FORMAT)}).
          Booking times are shown in {location.city} time.
        </Text>
      ) : null}
    </View>
  );
}
