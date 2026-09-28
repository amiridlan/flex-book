import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import type { StaffBooking } from '@/api/schemas/booking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { DayPassPicker, SlotPicker } from '@/features/locations/components/slot-picker';
import { priceLabel } from '@/features/locations/space-labels';
import { useAvailability, useLocation } from '@/features/locations/use-locations';
import { LocationSwitcher } from '@/features/staff/components/location-switcher';
import { StaffBrandScope } from '@/features/staff/components/staff-brand-scope';
import { useWalkIn } from '@/features/staff/use-staff';
import { useStaffLocation } from '@/features/staff/use-staff-location';
import { applyServerErrors } from '@/lib/form-errors';
import { formatInZone, TIME_FORMAT, todayIn } from '@/lib/time';

const walkInFormSchema = z.object({
  spaceId: z.string().min(1, 'Choose a space.'),
  slotStart: z.string().min(1, 'Choose a time.'),
  guestName: z.string().trim().min(2, 'Enter the guest’s name.').max(80, 'Name is too long.'),
  guestEmail: z.email('Enter a valid email address.'),
});
type WalkInForm = z.infer<typeof walkInFormSchema>;

const EMPTY: WalkInForm = { spaceId: '', slotStart: '', guestName: '', guestEmail: '' };

export default function StaffWalkInScreen() {
  const { locations, all, current, setLocationId } = useStaffLocation();

  if (locations.isPending) return <LoadingState />;
  if (locations.isError) {
    return (
      <Screen>
        <ErrorState error={locations.error} onRetry={() => void locations.refetch()} />
      </Screen>
    );
  }
  if (!current) {
    return (
      <Screen>
        <EmptyState title="No locations assigned" />
      </Screen>
    );
  }

  return (
    <StaffBrandScope>
      <Screen scroll>
        <ScreenHeader
          title="Walk-in booking"
          subtitle={`${current.name}, ${current.city} · today · checked in on save`}
        />
        <LocationSwitcher locations={all} currentId={current.id} onSelect={setLocationId} />
        {/* Keyed by location so switching resets the form. */}
        <WalkInFormView key={current.id} locationId={current.id} timeZone={current.timezone} />
      </Screen>
    </StaffBrandScope>
  );
}

function WalkInFormView({ locationId, timeZone }: { locationId: string; timeZone: string }) {
  const location = useLocation(locationId);
  const walkIn = useWalkIn();
  const [created, setCreated] = useState<StaffBooking | null>(null);
  const today = todayIn(timeZone);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WalkInForm>({ resolver: zodResolver(walkInFormSchema), defaultValues: EMPTY });

  const spaceId = useWatch({ control, name: 'spaceId' });
  const availability = useAvailability(spaceId, today);

  if (location.isPending) return <LoadingState label="Loading spaces…" />;
  if (location.isError) {
    return <ErrorState error={location.error} onRetry={() => void location.refetch()} />;
  }

  const spaces = location.data.spaces.filter((s) => s.rate.unit !== 'month');

  const onSubmit = handleSubmit(async (values) => {
    const slot = availability.data?.slots.find((s) => s.startsAt === values.slotStart);
    if (!slot) {
      setError('slotStart', { message: 'Choose a time.' });
      return;
    }
    try {
      const booking = await walkIn.mutateAsync({
        spaceId: values.spaceId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
      });
      setCreated(booking);
      reset(EMPTY);
    } catch (error) {
      // Laravel-style 422 -> the matching form fields; everything else -> a banner.
      applyServerErrors(error, setError, {
        spaceId: 'spaceId',
        startsAt: 'slotStart',
        guestName: 'guestName',
        guestEmail: 'guestEmail',
      });
    }
  });

  if (created) {
    return (
      <Card>
        <Text accessibilityRole="alert" className="text-lg font-bold text-success">
          {created.customer.name} is booked in and checked in
        </Text>
        <Text className="text-sm text-text">
          {created.space.name} · {formatInZone(created.startsAt, timeZone, TIME_FORMAT)} –{' '}
          {formatInZone(created.endsAt, timeZone, TIME_FORMAT)}
        </Text>
        <Text className="text-xs text-text-muted">Ref {created.code}</Text>
        <Button label="New walk-in" variant="secondary" onPress={() => setCreated(null)} />
      </Card>
    );
  }

  return (
    <View className="gap-5">
      <Controller
        control={control}
        name="spaceId"
        render={({ field }) => (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-text">Space</Text>
            <View className="flex-row flex-wrap gap-2">
              {spaces.map((space) => (
                <Chip
                  key={space.id}
                  label={`${space.name} · ${priceLabel(space)}`}
                  selected={field.value === space.id}
                  onPress={() => {
                    field.onChange(space.id);
                    setValue('slotStart', '');
                  }}
                />
              ))}
            </View>
            {errors.spaceId ? (
              <Text className="text-sm text-danger">{errors.spaceId.message}</Text>
            ) : null}
          </View>
        )}
      />

      {spaceId ? (
        <Controller
          control={control}
          name="slotStart"
          render={({ field }) => (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-text">Time (today)</Text>
              {availability.isPending ? (
                <LoadingState label="Checking free times…" />
              ) : availability.isError ? (
                <ErrorState
                  error={availability.error}
                  onRetry={() => void availability.refetch()}
                />
              ) : !availability.data.slots.some((s) => s.available) ? (
                <Text className="text-sm text-text-muted">No free times left today.</Text>
              ) : spaces.find((s) => s.id === spaceId)?.rate.unit === 'day' &&
                availability.data.slots[0] ? (
                <DayPassPicker
                  slot={availability.data.slots[0]}
                  timeZone={timeZone}
                  selected={field.value === availability.data.slots[0].startsAt}
                  onSelect={(slot) => field.onChange(slot.startsAt)}
                />
              ) : (
                <SlotPicker
                  slots={availability.data.slots}
                  timeZone={timeZone}
                  selected={field.value || null}
                  onSelect={(slot) => field.onChange(slot.startsAt)}
                />
              )}
              {errors.slotStart ? (
                <Text className="text-sm text-danger">{errors.slotStart.message}</Text>
              ) : null}
            </View>
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="guestName"
        render={({ field }) => (
          <TextField
            label="Guest name"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={errors.guestName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="guestEmail"
        render={({ field }) => (
          <TextField
            label="Guest email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={errors.guestEmail?.message}
            hint="Used for the receipt only. Shown masked on the staff board."
          />
        )}
      />

      {errors.root?.server ? (
        <View accessibilityRole="alert" className="rounded-xl bg-danger-soft p-4">
          <Text className="text-sm text-danger">{errors.root.server.message}</Text>
        </View>
      ) : null}

      <Button label="Book and check in" onPress={() => void onSubmit()} loading={isSubmitting} />
    </View>
  );
}
