import { Pressable, Text, View } from 'react-native';

import type { Slot } from '@/api/schemas/availability';
import { formatInZone, TIME_FORMAT } from '@/lib/time';

type SlotPickerProps = {
  readonly slots: readonly Slot[];
  readonly timeZone: string;
  readonly selected: string | null;
  readonly onSelect: (slot: Slot) => void;
};

/** Hourly slots, labelled in the location's timezone. */
export function SlotPicker({ slots, timeZone, selected, onSelect }: SlotPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {slots.map((slot) => {
        const label = formatInZone(slot.startsAt, timeZone, TIME_FORMAT);
        const isSelected = slot.startsAt === selected;
        return (
          <Pressable
            key={slot.startsAt}
            accessibilityRole="button"
            accessibilityLabel={slot.available ? label : `${label}, unavailable`}
            accessibilityState={{ selected: isSelected, disabled: !slot.available }}
            disabled={!slot.available}
            onPress={() => onSelect(slot)}
            className={`min-h-touch min-w-[96px] items-center justify-center rounded-xl border px-3 ${
              isSelected
                ? 'border-primary bg-primary'
                : slot.available
                  ? 'border-border bg-surface hover:border-primary/60 active:bg-surface-muted'
                  : 'border-surface-muted bg-surface-muted'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isSelected
                  ? 'text-on-primary'
                  : slot.available
                    ? 'text-text'
                    : 'text-text-muted line-through'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type DayPassPickerProps = {
  readonly slot: Slot;
  readonly timeZone: string;
  readonly selected: boolean;
  readonly onSelect: (slot: Slot) => void;
};

/** A hot desk is one all-day slot with a seat count. */
export function DayPassPicker({ slot, timeZone, selected, onSelect }: DayPassPickerProps) {
  const range = `${formatInZone(slot.startsAt, timeZone, TIME_FORMAT)} – ${formatInZone(slot.endsAt, timeZone, TIME_FORMAT)}`;
  const seats = slot.remaining === null ? '' : `${slot.remaining} desks left`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Full day, ${range}, ${slot.available ? seats : 'unavailable'}`}
      accessibilityState={{ selected, disabled: !slot.available }}
      disabled={!slot.available}
      onPress={() => onSelect(slot)}
      className={`min-h-touch gap-1 rounded-2xl border p-4 ${
        selected
          ? 'border-primary bg-primary-soft'
          : 'border-border bg-surface hover:border-primary/60'
      } ${slot.available ? '' : 'opacity-50'}`}
    >
      <Text className="text-base font-semibold text-text">Full day · {range}</Text>
      <Text className="text-sm text-text-muted">{slot.available ? seats : 'Fully booked'}</Text>
    </Pressable>
  );
}
