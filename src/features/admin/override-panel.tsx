import { useState } from 'react';
import { Text, View } from 'react-native';

import { firstError } from '@/api/client/api-error';
import type { StaffBooking } from '@/api/schemas/booking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useOverrideBooking } from '@/features/staff/use-staff';
import { formatInZone, TIME_FORMAT } from '@/lib/time';

type OverridePanelProps = {
  readonly booking: StaffBooking;
  readonly onDone: () => void;
};

/**
 * Super admin: cancel a booking, or check a guest in outside the usual window.
 * Both need a reason, which the activity log keeps.
 */
export function OverridePanel({ booking, onDone }: OverridePanelProps) {
  const override = useOverrideBooking();
  const [reason, setReason] = useState('');
  const tz = booking.location.timezone;
  const time = `${formatInZone(booking.startsAt, tz, TIME_FORMAT)} – ${formatInZone(booking.endsAt, tz, TIME_FORMAT)}`;
  const error = firstError(override.error);

  function run(action: 'cancel' | 'check_in') {
    override.mutate({ bookingId: booking.id, input: { action, reason } }, { onSuccess: onDone });
  }

  return (
    <Card>
      <Text accessibilityRole="header" className="text-lg font-semibold text-text">
        Override · {booking.customer.name}
      </Text>
      <Text className="text-sm text-text-muted">
        {booking.location.name} · {booking.space.name} · {time} · {booking.code}
      </Text>
      <View className="gap-3 pt-2">
        <TextField
          label="Reason"
          value={reason}
          onChangeText={setReason}
          error={error ?? undefined}
          hint="Required. Saved in the activity log."
        />
        <View className="flex-row flex-wrap gap-3">
          <Button
            label="Check in manually"
            onPress={() => run('check_in')}
            loading={override.isPending && override.variables?.input.action === 'check_in'}
          />
          {booking.status === 'confirmed' ? (
            <Button
              label="Cancel booking"
              variant="secondary"
              onPress={() => run('cancel')}
              loading={override.isPending && override.variables?.input.action === 'cancel'}
            />
          ) : null}
          <Button label="Close" variant="ghost" onPress={onDone} />
        </View>
      </View>
    </Card>
  );
}
