import { Pressable, View } from 'react-native';

import { Stack, Text, useTheme } from '@/design-system';

export type OptionCardProps = {
  label: string;
  description?: string;
  glyph?: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Full-width tappable choice.
 *
 * Sized generously (64pt+) because these are the fastest steps in the flow and
 * a mis-tap costs more than the space saved by a compact row.
 */
export function OptionCard({
  label,
  description,
  glyph,
  selected,
  onPress,
}: OptionCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.lg,
        padding: theme.spacing.lg,
        minHeight: 68,
        borderRadius: theme.radius.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        backgroundColor: selected ? theme.colors.accentMuted : theme.colors.surface,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {glyph ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? theme.colors.accent : theme.colors.surfaceElevated,
          }}
        >
          <Text
            variant="heading"
            style={{ color: selected ? theme.colors.onAccent : theme.colors.textMuted }}
          >
            {glyph}
          </Text>
        </View>
      ) : null}

      <Stack gap="xs" flex={1}>
        <Text variant="callout">{label}</Text>
        {description ? (
          <Text variant="caption" color="muted">
            {description}
          </Text>
        ) : null}
      </Stack>
    </Pressable>
  );
}
