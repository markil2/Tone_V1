import { Pressable, View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { haptics } from '@/shared/haptics';

export type NumberRowProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

/**
 * A row of tappable integers, for short ranges such as training days (0–7).
 *
 * One tap versus a drag-and-release — for a range this small a ruler would be
 * strictly slower, and speed is the whole design constraint of this flow.
 */
export function NumberRow({ min, max, value, onChange }: NumberRowProps) {
  const theme = useTheme();
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      {values.map((n) => {
        const selected = n === value;
        return (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${n} days`}
            onPress={() => {
              haptics.select();
              onChange(n);
            }}
            style={{
              flex: 1,
              aspectRatio: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.md,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
            }}
          >
            <Text variant="callout" color={selected ? 'inverted' : 'default'}>
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
