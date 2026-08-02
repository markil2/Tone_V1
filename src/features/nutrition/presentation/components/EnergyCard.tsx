import { Pressable, View } from 'react-native';

import { Icon, Stack, Text, useTheme } from '@/design-system';
import { glow } from '@/features/dashboard';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import type { MacroTargets } from '../../domain/entities/nutrition';
import {
  MACRO_PROGRESS_LABELS,
  progressRatio,
  progressStatus,
} from '../../domain/use-cases/progress-status';
import { ProgressRing } from './ProgressRing';

export type MacroProgressProps = {
  label: string;
  consumed: number;
  goal: number;
  unit?: string;
};

/** One macro: ring, current/goal, and the status in words. */
export function MacroProgress({ label, consumed, goal, unit = 'g' }: MacroProgressProps) {
  const theme = useTheme();
  const status = progressStatus(consumed, goal);
  const ratio = progressRatio(consumed, goal);

  const color = status === 'over' ? theme.colors.warning : theme.colors.accent;

  return (
    <Stack
      gap="xs"
      align="center"
      flex={1}
      accessible
      accessibilityLabel={`${label}, ${Math.round(consumed)} of ${goal} ${unit}, ${
        MACRO_PROGRESS_LABELS[status]
      }`}
    >
      <ProgressRing ratio={ratio} size={46} strokeWidth={4} color={color} />
      <Text variant="caption" color="muted" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
        {Math.round(consumed)}
        {unit} / {goal}
        {unit}
      </Text>
      <Text variant="caption" style={{ color }} numberOfLines={1}>
        {MACRO_PROGRESS_LABELS[status]}
      </Text>
    </Stack>
  );
}

/**
 * Energy and macros.
 *
 * The whole card is one button — the design gives it no separate affordance, and
 * making only part of it tappable would leave most of a large surface dead.
 */
export function EnergyCard({
  consumed,
  targets,
  onPress,
}: {
  consumed: MacroTargets;
  targets: MacroTargets;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  const status = progressStatus(consumed.calories, targets.calories);
  const energyWord =
    status === 'over' ? 'Over target' : status === 'low' ? 'Under fuelled' : 'Well fueled';

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`Energy and macros. ${Math.round(consumed.calories)} of ${
        targets.calories
      } kilocalories, ${energyWord}`}
      accessibilityHint="Opens calorie history, weekly averages and trends"
      style={({ pressed }) => [
        {
          backgroundColor: 'rgba(11, 18, 32, 0.72)',
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
          padding: theme.spacing.xl,
          opacity: pressed ? 0.85 : 1,
        },
        isFocused ? glow(theme.colors.dashboard.glowSoft, 12) : null,
      ]}
    >
      <Stack gap="lg">
        <Stack direction="row" gap="lg" align="center">
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: theme.radius.full,
              borderWidth: 1,
              borderColor: theme.colors.dashboard.bodyStroke,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="plate" size={30} color={theme.colors.accent} />
          </View>

          <Stack gap="xs" flex={1}>
            <Text variant="heading">Energy &amp; macros</Text>
            <Stack direction="row" gap="xs" align="baseline">
              <Text variant="caption" color="muted">
                Energy:
              </Text>
              <Text variant="caption" color="accent">
                {energyWord}
              </Text>
            </Stack>
            <Stack direction="row" gap="xs" align="baseline">
              <Text variant="title" color="accent" style={{ fontVariant: ['tabular-nums'] }}>
                {Math.round(consumed.calories).toLocaleString()}
              </Text>
              <Text variant="callout" color="muted">
                / {targets.calories.toLocaleString()} kcal
              </Text>
            </Stack>
          </Stack>

          <Icon name="chevronRight" size={18} color={theme.colors.textMuted} />
        </Stack>

        <View style={{ height: 1, backgroundColor: theme.colors.border }} />

        <Stack direction="row" gap="md">
          <MacroProgress label="Protein" consumed={consumed.proteinG} goal={targets.proteinG} />
          <MacroProgress label="Carbs" consumed={consumed.carbsG} goal={targets.carbsG} />
          <MacroProgress label="Fats" consumed={consumed.fatG} goal={targets.fatG} />
        </Stack>
      </Stack>
    </Pressable>
  );
}
