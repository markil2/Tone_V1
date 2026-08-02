import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { Stack, Text, useTheme } from '@/design-system';
import {
  formatLastTrained,
  MUSCLE_STATUS_LABELS,
  type MuscleData,
} from '../../domain/entities/dashboard';
import { MuscleThumbnail } from './body/MuscleThumbnail';
import { GlowCard } from './GlowCard';
import { CloseButton } from './Panel';

/** A labelled percentage with a progress track underneath. */
function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  const theme = useTheme();

  return (
    <Stack gap="xs" flex={1}>
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="heading" style={{ color, fontVariant: ['tabular-nums'] }}>
        {value}%
      </Text>
      <View
        style={{
          height: 3,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: '100%',
            backgroundColor: color,
          }}
        />
      </View>
    </Stack>
  );
}

export function MuscleDetailsCard({
  muscle,
  onClose,
}: {
  muscle: MuscleData;
  onClose: () => void;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const statusColor = theme.colors.dashboard.muscle[muscle.status];

  return (
    <Animated.View
      // Keyed on the muscle so switching selection cross-fades rather than
      // silently swapping the numbers under the same heading.
      key={muscle.id}
      entering={reducedMotion ? undefined : FadeIn.duration(theme.motion.base)}
      exiting={reducedMotion ? undefined : FadeOut.duration(theme.motion.fast)}
    >
      <GlowCard active>
        <Stack gap="lg">
          <Stack direction="row" gap="md" align="center">
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.dashboard.bodyStroke,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <MuscleThumbnail muscleId={muscle.id} />
            </View>

            <Stack gap="xs" flex={1}>
              <Text variant="heading">{muscle.name}</Text>
              <Stack direction="row" gap="xs" align="center">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: theme.radius.full,
                    backgroundColor: statusColor,
                  }}
                />
                <Text variant="caption" color="muted">
                  {MUSCLE_STATUS_LABELS[muscle.status]}
                </Text>
              </Stack>
            </Stack>

            <CloseButton
              label={`Close ${muscle.name} details`}
              onPress={onClose}
              size={30}
            />
          </Stack>

          <Stack direction="row" gap="lg">
            <Metric label="Training load" value={muscle.trainingLoad} color={theme.colors.accent} />
            <Metric label="Recovery" value={muscle.recovery} color={statusColor} />
          </Stack>

          <Stack gap="sm">
            <Stack direction="row" justify="space-between" gap="md">
              <Text variant="caption" color="muted">
                Last trained
              </Text>
              <Text variant="caption">{formatLastTrained(muscle.lastTrainedDaysAgo)}</Text>
            </Stack>

            <Stack direction="row" justify="space-between" gap="md">
              <Text variant="caption" color="muted">
                Suggested
              </Text>
              <Text variant="caption" color="accent">
                {muscle.recommendation}
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </GlowCard>
    </Animated.View>
  );
}
