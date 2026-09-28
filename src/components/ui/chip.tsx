import { Pressable, Text } from 'react-native';

type ChipProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
};

/** A selectable filter chip. Announced as a radio-like toggle to screen readers. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-touch items-center justify-center rounded-full border px-4 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-surface active:bg-surface-muted'
      }`}
    >
      <Text className={`text-sm font-semibold ${selected ? 'text-on-primary' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
