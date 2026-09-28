import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Location } from '@/api/schemas/location';
import { colors } from '@/theme/tokens';

type LocationDropdownProps = {
  readonly locations: readonly Location[];
  readonly current: Location;
  readonly onSelect: (id: string) => void;
};

/**
 * Desktop location picker for staff with several locations. Replaces the
 * sideways-scrolling chips, which hide options from mouse users.
 */
export function LocationDropdown({ locations, current, onSelect }: LocationDropdownProps) {
  const [open, setOpen] = useState(false);
  if (locations.length < 2) return null;

  return (
    <View className="relative z-30">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Location: ${current.name}, ${current.city}. Change location`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        className="min-h-touch flex-row items-center gap-3 rounded-lg border border-border bg-surface px-4 hover:border-primary/60"
      >
        <Ionicons name="location-outline" size={18} color={colors['text-muted']} />
        <Text className="text-sm font-medium text-text">
          {current.name} · {current.city}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors['text-muted']}
        />
      </Pressable>
      {open ? (
        <View
          role="menu"
          className="absolute right-0 top-14 w-80 rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {locations.map((location) => {
            const selected = location.id === current.id;
            return (
              <Pressable
                key={location.id}
                role="menuitem"
                accessibilityLabel={`${location.name}, ${location.city}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelect(location.id);
                  setOpen(false);
                }}
                className={`flex-row items-center justify-between px-4 py-2.5 hover:bg-surface-muted ${
                  selected ? 'bg-primary-soft/60' : ''
                }`}
              >
                <View>
                  <Text className="text-sm font-medium text-text">{location.name}</Text>
                  <Text className="text-xs text-text-muted">{location.city}</Text>
                </View>
                {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
