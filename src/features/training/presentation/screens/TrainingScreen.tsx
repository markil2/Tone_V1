import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  FixedThemeProvider,
  Icon,
  Stack,
  Text,
  useTheme,
  type IconName,
} from '@/design-system';
import { useSession } from '@/features/auth';
import {
  DashboardHeader,
  GlowCard,
  MUSCLE_LABELS,
  formatDuration,
  glow,
  useDashboard,
  type MuscleData,
} from '@/features/dashboard';
import { useProfile } from '@/features/profile';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import type { ActivityType } from '../../domain/entities/workout';
import { ACTIVITY_LABELS } from '../../domain/entities/workout';
import { ActivityTypeSelector } from '../components/ActivityTypeSelector';

const MAX_WIDTH = 1120;

export type SessionMode = 'free' | 'routine' | 'ai';

const MODES: { mode: SessionMode; label: string; icon: IconName }[] = [
  { mode: 'free', label: 'Free workout', icon: 'dumbbell' },
  { mode: 'routine', label: 'Routine', icon: 'clipboard' },
  { mode: 'ai', label: 'AI plan', icon: 'sparkle' },
];

function ModeButton({
  label,
  icon,
  isActive,
  onPress,
}: {
  label: string;
  icon: IconName;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="radio"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flex: 1,
          minWidth: 0,
          flexShrink: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.xs,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor:
            isActive || isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
          backgroundColor: isActive ? theme.colors.dashboard.glowFaint : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
        isActive ? glow(theme.colors.dashboard.glowSoft, 10) : null,
      ]}
    >
      <Icon name={icon} size={16} color={isActive ? theme.colors.accent : theme.colors.textMuted} />
      <Text
        variant="caption"
        color={isActive ? 'accent' : 'muted'}
        numberOfLines={1}
        style={{ flexShrink: 1 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** One muscle's readiness, as in the design's "Muscle load" strip. */
function MuscleLoadCell({ muscle }: { muscle: MuscleData }) {
  const theme = useTheme();
  const label =
    muscle.status === 'recovered' ? 'Fresh' : muscle.status === 'balanced' ? 'Ready' : 'Loaded';

  return (
    <Stack gap="xs" align="center" flex={1}>
      <Text variant="caption" color="muted" numberOfLines={1}>
        {MUSCLE_LABELS[muscle.id]}
      </Text>
      <Text
        variant="callout"
        style={{ color: theme.colors.dashboard.muscle[muscle.status] }}
      >
        {label}
      </Text>
    </Stack>
  );
}

export type TrainingScreenProps = {
  onStartWorkout: (mode: SessionMode) => void;
  onOpenFormCheck: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
};

/**
 * Training.
 *
 * Readiness, muscle load and the recovery figure are read from the dashboard
 * feature rather than recomputed — the same numbers the body map shows, so the
 * two screens can never disagree about whether you are recovered.
 */
export function TrainingScreen(props: TrainingScreenProps) {
  return (
    <FixedThemeProvider scheme="dark">
      <TrainingContent {...props} />
    </FixedThemeProvider>
  );
}

function TrainingContent({
  onStartWorkout,
  onOpenFormCheck,
  onOpenProfile,
  onOpenSettings,
}: TrainingScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { data: profile } = useProfile();
  const { data } = useDashboard();

  const [activity, setActivity] = useState<ActivityType>('weightlifting');
  const [mode, setMode] = useState<SessionMode>('free');

  const isLifting = activity === 'weightlifting';

  // The three groups the design surfaces: push muscles plus legs.
  const loadCells = (data?.muscles ?? []).filter((muscle) =>
    ['pectoral', 'deltoid', 'triceps'].includes(muscle.id),
  );

  const recovery = data?.recovery ?? null;
  const readiness =
    recovery === null
      ? 'Loading'
      : recovery >= 75
        ? 'Ready to lift'
        : recovery >= 55
          ? 'Train with care'
          : 'Prioritise recovery';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.dashboard.backdrop }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: theme.spacing['2xl'],
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.lg,
          maxWidth: MAX_WIDTH,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Stack direction="row" justify="space-between" align="flex-start" gap="lg">
          <Stack gap="xs" flex={1}>
            <Text variant="display">Training</Text>
            <Text variant="body" color="muted">
              {isLifting ? 'Ready to perform' : ACTIVITY_LABELS[activity]}
            </Text>
          </Stack>

          <DashboardHeader
            displayName={profile?.displayName ?? null}
            email={session?.user.email ?? null}
            onOpenProfile={onOpenProfile}
            onOpenSettings={onOpenSettings}
          />
        </Stack>

        <GlowCard>
          <Stack direction="row" gap="lg" align="center">
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.full,
                borderWidth: 1,
                borderColor: theme.colors.dashboard.bodyStroke,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="dumbbell" size={26} color={theme.colors.accent} />
            </View>

            <Stack gap="xs" flex={1}>
              <Text variant="heading">{readiness}</Text>
              <Stack direction="row" gap="xs" align="baseline">
                <Text variant="callout" color="muted">
                  Recovery
                </Text>
                <Text variant="heading" color="accent" style={{ fontVariant: ['tabular-nums'] }}>
                  {recovery === null ? '—' : `${recovery}%`}
                </Text>
              </Stack>
              <Text variant="caption" color="muted">
                {data ? `${data.strain}% strain today` : 'Loading your metrics…'}
              </Text>
            </Stack>
          </Stack>
        </GlowCard>

        <ActivityTypeSelector value={activity} onChange={setActivity} />

        {isLifting ? (
          <>
            <GlowCard>
              <Stack gap="lg">
                <Text variant="heading">Today’s session</Text>

                <Stack direction="row" gap="sm">
                  {MODES.map((entry) => (
                    <ModeButton
                      key={entry.mode}
                      label={entry.label}
                      icon={entry.icon}
                      isActive={entry.mode === mode}
                      onPress={() => setMode(entry.mode)}
                    />
                  ))}
                </Stack>

                <Text variant="caption" color="muted">
                  {mode === 'free'
                    ? 'Start empty and add exercises as you go.'
                    : mode === 'routine'
                      ? 'You haven’t saved any routines yet — finish a workout and save it as one.'
                      : 'AI plans arrive with the coaching milestone. They will appear here as routines.'}
                </Text>

                <Button label="Start lifting" size="lg" onPress={() => onStartWorkout(mode)} />
              </Stack>
            </GlowCard>

            <GlowCard>
              <Stack gap="lg">
                <Stack direction="row" gap="lg" align="center">
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: theme.radius.full,
                      borderWidth: 1,
                      borderColor: theme.colors.dashboard.bodyStroke,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="camera" size={24} color={theme.colors.accent} />
                  </View>

                  <Stack gap="xs" flex={1}>
                    <Text variant="heading">Form check</Text>
                    <Text variant="caption" color="muted">
                      Record a set and get rep count and technique feedback.
                    </Text>
                  </Stack>
                </Stack>

                <Button label="Check my form" variant="secondary" onPress={onOpenFormCheck} />
              </Stack>
            </GlowCard>

            <GlowCard>
              <Stack gap="lg">
                <Text variant="heading">Muscle load</Text>
                {loadCells.length > 0 ? (
                  <Stack direction="row" gap="md">
                    {loadCells.map((muscle) => (
                      <MuscleLoadCell key={muscle.id} muscle={muscle} />
                    ))}
                  </Stack>
                ) : (
                  <Text variant="caption" color="muted">
                    Loading muscle readiness…
                  </Text>
                )}
              </Stack>
            </GlowCard>

            <GlowCard>
              <Stack gap="md">
                <Text variant="heading">Recent lifting</Text>
                <Text variant="caption" color="muted">
                  No workouts logged yet. Your finished sessions appear here with duration
                  and set count.
                </Text>
              </Stack>
            </GlowCard>

            {data ? (
              <Text variant="caption" color="muted" align="center">
                Sleep last night {formatDuration(data.sleepDurationMinutes)} · readiness is an
                estimate, not a measurement.
              </Text>
            ) : null}
          </>
        ) : (
          <GlowCard>
            <Stack gap="sm">
              <Text variant="heading">{ACTIVITY_LABELS[activity]} tracking isn’t built yet</Text>
              <Text variant="body" color="muted">
                Weightlifting has a full session tracker. Cardio activities need GPS and heart
                rate, which arrive with the wearable integration.
              </Text>
            </Stack>
          </GlowCard>
        )}
      </ScrollView>
    </View>
  );
}
