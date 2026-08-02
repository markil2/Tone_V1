import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../theme';
import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.accent
      : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="caption" color="muted">
        {label}
      </Text>

      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 48,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.lg,
          color: theme.colors.text,
          ...theme.typography.body,
          fontWeight: '400',
        }}
        {...rest}
      />

      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
