import { Pressable, View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { haptics } from '@/shared/haptics';

export type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
};

/** Compact inline choice — for 2–3 short options such as units. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const height = size === 'sm' ? 36 : 48;

  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 3,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.select();
              onChange(option.value);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              flexShrink: 1,
              height,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.sm,
              backgroundColor: selected ? theme.colors.accent : 'transparent',
            }}
          >
            <Text
              variant="caption"
              color={selected ? 'inverted' : 'muted'}
              numberOfLines={1}
              style={{ flexShrink: 1, textAlign: 'center' }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
