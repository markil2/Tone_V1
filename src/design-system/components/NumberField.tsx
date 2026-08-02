import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { useTheme } from '../theme';
import { Text } from './Text';

export type NumberFieldProps = {
  value: number | null;
  /** Null signals empty or out-of-range — callers use it to block progress. */
  onChange: (value: number | null) => void;
  min: number;
  max: number;
  unit?: string;
  label?: string;
  allowDecimal?: boolean;
  autoFocus?: boolean;
  align?: 'left' | 'center';
};

/**
 * Numeric entry with range validation.
 *
 * Three details that matter more than they look:
 *
 * • Text is held in local state, not derived from `value` on every keystroke.
 *   Coercing to a number as the user types makes backspacing and decimal points
 *   fight the caret.
 * • The range error appears on blur, never mid-typing — otherwise entering "1"
 *   toward "175" flashes an error on the first character.
 * • Pre-filled text is selected on focus, so a single keystroke replaces it.
 *   That keeps the default-value speed benefit without forcing a clear first.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  unit,
  label,
  allowDecimal = false,
  autoFocus = false,
  align = 'center',
}: NumberFieldProps) {
  const theme = useTheme();
  const [text, setText] = useState(value === null ? '' : String(value));
  const [focused, setFocused] = useState(false);
  const [showError, setShowError] = useState(false);

  const isValid = value !== null;

  const handleChange = (next: string) => {
    // Strip anything that can't belong in the number, so a stray character from
    // a keyboard layout can't wedge the field into a permanently invalid state.
    const cleaned = allowDecimal
      ? next.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
      : next.replace(/[^0-9]/g, '');

    setText(cleaned);
    setShowError(false);

    if (cleaned === '' || cleaned === '.') {
      onChange(null);
      return;
    }

    const parsed = Number(cleaned);
    onChange(Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null);
  };

  const borderColor = showError && !isValid
    ? theme.colors.danger
    : focused
      ? theme.colors.accent
      : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <Text variant="caption" color="muted">
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: theme.spacing.sm,
          height: 72,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderWidth: focused ? 2 : 1,
          borderColor,
          backgroundColor: theme.colors.surface,
        }}
      >
        <TextInput
          value={text}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setShowError(true);
          }}
          autoFocus={autoFocus}
          selectTextOnFocus
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          placeholder="—"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={6}
          style={{
            ...theme.typography.metric,
            color: theme.colors.text,
            fontVariant: ['tabular-nums'],
            textAlign: align,
            minWidth: 72,
            paddingVertical: 0,
          }}
        />

        {unit ? (
          <Text variant="heading" color="muted">
            {unit}
          </Text>
        ) : null}
      </View>

      {showError && !isValid ? (
        <Text variant="caption" color="danger">
          Enter a value between {min} and {max}
          {unit ? ` ${unit}` : ''}.
        </Text>
      ) : null}
    </View>
  );
}
