import { Pressable, View } from 'react-native';

import { Button, Icon, Stack, Text, useTheme } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import { haptics } from '@/shared/haptics';
import {
  cupsFromMl,
  dayPartOf,
  DAY_PART_LABELS,
  type DayPart,
  type WaterData,
} from '../../domain/entities/nutrition';
import { progressRatio } from '../../domain/use-cases/progress-status';
import { ProgressRing } from './ProgressRing';

const PARTS: DayPart[] = ['morning', 'afternoon', 'evening'];

/**
 * Morning · afternoon · evening, filled by when water was actually logged.
 *
 * Derived from history rather than from the clock, so the timeline reflects what
 * happened rather than what time it is now.
 */
function Timeline({ water }: { water: WaterData }) {
  const theme = useTheme();
  const logged = new Set(water.history.map((entry) => dayPartOf(entry.loggedAt)));

  return (
    <Stack gap="sm">
      <View style={{ height: 2, backgroundColor: theme.colors.border, marginHorizontal: 8 }} />
      <Stack direction="row" justify="space-between" style={{ marginTop: -13 }}>
        {PARTS.map((part) => {
          const isFilled = logged.has(part);

          return (
            <Stack
              key={part}
              gap="xs"
              align="center"
              accessible
              accessibilityLabel={`${DAY_PART_LABELS[part]}: ${
                isFilled ? 'water logged' : 'nothing logged'
              }`}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: theme.radius.full,
                  borderWidth: 2,
                  borderColor: isFilled ? theme.colors.accent : theme.colors.border,
                  backgroundColor: isFilled
                    ? theme.colors.accent
                    : theme.colors.dashboard.backdrop,
                }}
              />
              <Text variant="caption" color={isFilled ? 'accent' : 'muted'}>
                {DAY_PART_LABELS[part]}
              </Text>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function HydrationCard({
  water,
  onAddCup,
  onAddBottle,
  onUndo,
}: {
  water: WaterData;
  onAddCup: () => void;
  onAddBottle: () => void;
  onUndo: () => void;
}) {
  const theme = useTheme();

  const cups = cupsFromMl(water.consumedMl);
  const goalCups = cupsFromMl(water.goalMl);
  const ratio = progressRatio(water.consumedMl, water.goalMl);

  const add = (fn: () => void) => () => {
    haptics.select();
    fn();
  };

  return (
    <GlowCard>
      <Stack gap="lg">
        <Text variant="heading">Water</Text>

        <Stack direction="row" gap="lg" align="center">
          <ProgressRing ratio={ratio} size={112} strokeWidth={7}>
            <Stack
              gap="none"
              align="center"
              accessible
              accessibilityLabel={`${cups} of ${goalCups} cups of water`}
            >
              <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>
                {Number.isInteger(cups) ? cups : cups.toFixed(1)}
              </Text>
              <Text variant="caption" color="muted">
                / {goalCups} cups
              </Text>
            </Stack>
          </ProgressRing>

          <Stack gap="sm" flex={1}>
            <Button label="+ 1 cup" variant="secondary" size="sm" onPress={add(onAddCup)} />
            <Button label="+ bottle" variant="secondary" size="sm" onPress={add(onAddBottle)} />
            <Pressable
              onPress={onUndo}
              disabled={water.history.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Undo last water entry"
              hitSlop={8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.xs,
                paddingVertical: theme.spacing.xs,
                opacity: water.history.length === 0 ? 0.3 : 1,
              }}
            >
              <Icon name="refresh" size={14} color={theme.colors.textMuted} />
              <Text variant="caption" color="muted">
                Undo
              </Text>
            </Pressable>
          </Stack>
        </Stack>

        <Timeline water={water} />
      </Stack>
    </GlowCard>
  );
}
