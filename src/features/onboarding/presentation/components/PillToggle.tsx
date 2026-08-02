import { Pressable } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { haptics } from '@/shared/haptics';

export type PillToggleProps = {
  label: string;
  glyph?: string;
  selected: boolean;
  onToggle: () => void;
  /** Domain accent, so pillars stay colour-consistent with the dashboard. */
  tint?: string;
};

export function PillToggle({ label, glyph, selected, onToggle, tint }: PillToggleProps) {
  const theme = useTheme();
  const activeColor = tint ?? theme.colors.accent;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={() => {
        haptics.select();
        onToggle();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        minHeight: 48,
        minWidth: 0,
        flexShrink: 1,
        borderRadius: theme.radius.full,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? activeColor : theme.colors.border,
        backgroundColor: selected ? `${activeColor}1F` : theme.colors.surface,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {glyph ? (
        <Text variant="callout" style={{ color: selected ? activeColor : theme.colors.textMuted }}>
          {glyph}
        </Text>
      ) : null}
      <Text
        variant="callout"
        color={selected ? 'default' : 'muted'}
        style={{ flexShrink: 1 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
