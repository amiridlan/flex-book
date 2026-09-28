import type { Ref } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/theme/tokens';

type TextFieldProps = TextInputProps & {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
  /** React 19: refs are plain props. */
  readonly ref?: Ref<TextInput>;
};

/** Labelled input with an inline error that screen readers announce. */
export function TextField({ label, error, hint, ref, ...input }: TextFieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-semibold text-text">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled: input.editable === false }}
        aria-invalid={Boolean(error)}
        placeholderTextColor={colors['text-muted']}
        className={`min-h-touch rounded-xl border bg-surface px-3 text-base text-text ${
          error ? 'border-danger' : 'border-border'
        }`}
        {...input}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-sm text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-xs text-text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
