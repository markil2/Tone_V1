import { Pressable, ScrollView, View } from 'react-native';

import { Icon, Stack, Text, useTheme, type IconName } from '@/design-system';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import type { BodyView } from '../../domain/entities/dashboard';
import { glow } from './GlowCard';

const CONTROLS: { view: BodyView; label: string; icon: IconName; hint: string }[] = [
  {
    view: 'overview',
    label: 'Dashboard',
    icon: 'home',
    hint: 'Show today’s highlighted muscles and overall metrics',
  },
  {
    view: 'muscles',
    label: 'Muscles',
    icon: 'body',
    hint: 'Colour the body by training load and pick a muscle',
  },
  {
    view: 'recovery',
    label: 'Recovery',
    icon: 'recovery',
    hint: 'Colour the body by recovery status',
  },
  { view: 'sleep', label: 'Sleep', icon: 'moon', hint: 'Open sleep details' },
  { view: 'ai', label: 'AI Coach', icon: 'network', hint: 'Open the AI Coach panel' },
];

/** One rail entry. Extracted so the focus-ring hook is not called inside a loop. */
function ControlButton({
  label,
  hint,
  icon,
  isActive,
  minWidth,
  onPress,
}: {
  label: string;
  hint: string;
  icon: IconName;
  isActive: boolean;
  minWidth: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.xs,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: isActive
            ? theme.colors.accent
            : isFocused
              ? theme.colors.dashboard.bodyStroke
              : 'transparent',
          backgroundColor: isActive ? theme.colors.dashboard.glowFaint : 'transparent',
          opacity: pressed ? 0.7 : 1,
          minWidth,
        },
        isActive ? glow(theme.colors.dashboard.glowSoft, 12) : null,
      ]}
    >
      <Icon name={icon} size={22} color={isActive ? theme.colors.accent : theme.colors.textMuted} />
      <Text variant="caption" color={isActive ? 'accent' : 'muted'} align="center">
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The five body views.
 *
 * A floating vertical rail where there is width for one, and a horizontal
 * scroller on phones — where a rail would either eat a third of the screen or
 * shrink the body it is meant to control.
 */
export function BodyViewControls({
  value,
  onChange,
}: {
  value: BodyView;
  onChange: (view: BodyView) => void;
}) {
  const theme = useTheme();
  const { isWide } = useBreakpoint();

  const items = CONTROLS.map((control) => (
    <ControlButton
      key={control.view}
      label={control.label}
      hint={control.hint}
      icon={control.icon}
      isActive={control.view === value}
      minWidth={isWide ? 76 : 72}
      onPress={() => onChange(control.view)}
    />
  ));

  if (isWide) {
    return (
      <View
        accessibilityRole="tablist"
        style={{
          borderWidth: 1,
          borderColor: theme.colors.dashboard.bodyStroke,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.sm,
          backgroundColor: 'rgba(11, 18, 32, 0.6)',
        }}
      >
        <Stack gap="xs">{items}</Stack>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={{ gap: theme.spacing.xs, paddingHorizontal: theme.spacing.xs }}
    >
      {items}
    </ScrollView>
  );
}
