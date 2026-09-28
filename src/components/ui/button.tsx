import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  /** Screen-reader hint when the label alone is not enough. */
  readonly accessibilityHint?: string;
  /** Overrides the spoken label, e.g. "Check in Hafiz Aziz" when a list repeats "Check in". */
  readonly accessibilityLabel?: string;
};

const CONTAINER: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-primary active:opacity-80',
  secondary: 'border border-border bg-surface active:bg-surface-muted',
  ghost: 'active:bg-surface-muted',
};

const LABEL: Readonly<Record<ButtonVariant, string>> = {
  primary: 'text-on-primary',
  secondary: 'text-text',
  ghost: 'text-primary',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityHint,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`min-h-touch flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${CONTAINER[variant]} ${inactive ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors['on-primary'] : colors.primary}
        />
      ) : null}
      <Text className={`text-base font-semibold ${LABEL[variant]}`}>{label}</Text>
    </Pressable>
  );
}
