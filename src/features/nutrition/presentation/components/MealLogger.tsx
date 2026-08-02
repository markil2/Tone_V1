import { Pressable } from 'react-native';

import { Icon, Stack, Text, useTheme, type IconName } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import { useFocusRing } from '@/shared/hooks/useFocusRing';

export type LogMethod = 'photo' | 'barcode' | 'voice' | 'manual';

const METHODS: { method: LogMethod; label: string; icon: IconName; hint: string }[] = [
  { method: 'photo', label: 'Photo', icon: 'camera', hint: 'Log a meal from a photo' },
  { method: 'barcode', label: 'Barcode', icon: 'barcode', hint: 'Scan a product barcode' },
  { method: 'voice', label: 'Voice', icon: 'mic', hint: 'Describe your meal out loud' },
];

function MethodButton({
  label,
  icon,
  hint,
  onPress,
}: {
  label: string;
  icon: IconName;
  hint: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        flexShrink: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={26} color={theme.colors.accent} />
      <Text variant="caption" color="muted">
        {label}
      </Text>
    </Pressable>
  );
}

export function MealLogger({ onSelect }: { onSelect: (method: LogMethod) => void }) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <GlowCard>
      <Stack gap="lg">
        <Text variant="heading">Log a meal</Text>

        <Stack direction="row" gap="sm">
          {METHODS.map((entry) => (
            <MethodButton
              key={entry.method}
              label={entry.label}
              icon={entry.icon}
              hint={entry.hint}
              onPress={() => onSelect(entry.method)}
            />
          ))}
        </Stack>

        <Pressable
          onPress={() => onSelect('manual')}
          {...focusProps}
          accessibilityRole="button"
          accessibilityLabel="Add manually"
          accessibilityHint="Opens the manual food entry form"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Icon name="edit" size={18} color={theme.colors.accent} />
          <Text variant="callout" color="accent">
            Add manually
          </Text>
        </Pressable>
      </Stack>
    </GlowCard>
  );
}
