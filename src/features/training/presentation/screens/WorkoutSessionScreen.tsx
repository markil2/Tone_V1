import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  FixedThemeProvider,
  Icon,
  Stack,
  Text,
  useTheme,
} from '@/design-system';
import { GlowCard, Panel, glow } from '@/features/dashboard';
import { findFormCheckExercise } from '@/features/form-check';
import { useProfile } from '@/features/profile';
import { haptics } from '@/shared/haptics';
import { EXERCISE_CATALOGUE } from '../../data/exercise-catalogue';
import type { Exercise } from '../../domain/entities/exercise';
import { MUSCLE_GROUP_LABELS } from '../../domain/entities/exercise';
import type { Workout, WorkoutExercise } from '../../domain/entities/workout';
import { formatElapsed, workoutMetrics } from '../../domain/use-cases/workout-metrics';
import { ExerciseLibrary } from '../components/ExerciseLibrary';
import { SetRow } from '../components/SetRow';
import { useActiveWorkout } from '../store/active-workout';

const KG_PER_LB = 0.45359237;
const MAX_WIDTH = 720;

/** Weight is stored in kg; imperial users type pounds. Convert only at this edge. */
function toDisplayWeight(weightKg: number | null, unit: 'kg' | 'lb'): string {
  if (weightKg === null) return '';
  const value = unit === 'kg' ? weightKg : weightKg / KG_PER_LB;
  return String(Math.round(value * 10) / 10);
}

function parseWeight(text: string, unit: 'kg' | 'lb'): number | null {
  const value = Number.parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return null;
  return unit === 'kg' ? value : value * KG_PER_LB;
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="xs" align="center" flex={1}>
      <Text variant="callout" color="accent" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text variant="caption" color="muted" numberOfLines={1}>
        {label}
      </Text>
    </Stack>
  );
}

function ExerciseCard({
  entry,
  exercise,
  index,
  total,
  unit,
  onMove,
  onRemove,
  onFormCheck,
}: {
  entry: WorkoutExercise;
  exercise: Exercise | undefined;
  index: number;
  total: number;
  unit: 'kg' | 'lb';
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  onFormCheck?: () => void;
}) {
  const theme = useTheme();
  const { addSet, updateSet, completeSet, uncompleteSet, copyPreviousSet } = useActiveWorkout();

  const completed = entry.sets.filter((set) => set.isCompleted).length;

  return (
    <GlowCard>
      <Stack gap="md">
        <Stack direction="row" align="center" gap="sm">
          <Stack gap="xs" flex={1}>
            <Text variant="heading">{exercise?.name ?? 'Unknown exercise'}</Text>
            <Text variant="caption" color="muted">
              {exercise ? MUSCLE_GROUP_LABELS[exercise.primaryMuscle] : '—'} · {completed}/
              {entry.sets.length} sets
            </Text>
          </Stack>

          {/* Explicit reorder controls sit alongside the drag affordance so
              reordering is possible without a precise drag — and works for
              keyboard and switch users, who cannot drag at all. */}
          <Pressable
            onPress={() => onMove(index, index - 1)}
            disabled={index === 0}
            accessibilityRole="button"
            accessibilityLabel={`Move ${exercise?.name ?? 'exercise'} up`}
            hitSlop={8}
            style={{ opacity: index === 0 ? 0.25 : 1, padding: theme.spacing.xs }}
          >
            <Icon name="chevronDown" size={16} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => onMove(index, index + 1)}
            disabled={index === total - 1}
            accessibilityRole="button"
            accessibilityLabel={`Move ${exercise?.name ?? 'exercise'} down`}
            hitSlop={8}
            style={{
              opacity: index === total - 1 ? 0.25 : 1,
              padding: theme.spacing.xs,
              transform: [{ rotate: '180deg' }],
            }}
          >
            <Icon name="chevronDown" size={16} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${exercise?.name ?? 'exercise'}`}
            hitSlop={8}
            style={{ padding: theme.spacing.xs }}
          >
            <Icon name="trash" size={16} color={theme.colors.textMuted} />
          </Pressable>
        </Stack>

        <Stack direction="row" gap="sm" style={{ paddingHorizontal: theme.spacing.sm }}>
          <Text variant="caption" color="muted" style={{ width: 24, textAlign: 'center' }}>
            #
          </Text>
          <Text variant="caption" color="muted" style={{ flex: 1, textAlign: 'center' }}>
            {unit}
          </Text>
          <Text variant="caption" color="muted" style={{ flex: 1, textAlign: 'center' }}>
            reps
          </Text>
          <View style={{ width: 16 }} />
          <View style={{ width: 30 }} />
        </Stack>

        <Stack gap="xs">
          {entry.sets.map((set, setIndex) => (
            <SetRow
              key={set.id}
              set={set}
              index={setIndex}
              unit={unit}
              displayWeight={toDisplayWeight(set.weightKg, unit)}
              canCopyPrevious={setIndex > 0}
              onChangeWeight={(text) =>
                updateSet(entry.id, set.id, { weightKg: parseWeight(text, unit) })
              }
              onChangeReps={(text) => {
                const reps = Number.parseInt(text, 10);
                updateSet(entry.id, set.id, {
                  reps: Number.isFinite(reps) && reps >= 0 ? reps : null,
                });
              }}
              onToggleComplete={() =>
                set.isCompleted ? uncompleteSet(entry.id, set.id) : completeSet(entry.id, set.id)
              }
              onCopyPrevious={() => copyPreviousSet(entry.id, set.id)}
            />
          ))}
        </Stack>

        <Button
          label="Add set"
          variant="secondary"
          size="sm"
          onPress={() => {
            haptics.tick();
            addSet(entry.id);
          }}
        />

        {onFormCheck ? (
          <Button
            label="Form + rep check"
            variant="secondary"
            size="sm"
            onPress={onFormCheck}
          />
        ) : null}
      </Stack>
    </GlowCard>
  );
}

export type WorkoutSessionScreenProps = {
  onExit: () => void;
  onFinished: (workout: Workout) => void;
  onOpenFormCheck: (exerciseId: string) => void;
};

/**
 * The live workout.
 *
 * Reads and writes the module-level active-workout store rather than local
 * state, so navigating away to the library — or backgrounding the app — cannot
 * lose logged sets.
 */
export function WorkoutSessionScreen(props: WorkoutSessionScreenProps) {
  return (
    <FixedThemeProvider scheme="dark">
      <SessionContent {...props} />
    </FixedThemeProvider>
  );
}

function SessionContent({ onExit, onFinished, onOpenFormCheck }: WorkoutSessionScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();

  const workout = useActiveWorkout((state) => state.workout);
  const { addExercise, removeExercise, reorderExercise, finish, discard } = useActiveWorkout();

  const [isLibraryOpen, setLibraryOpen] = useState(false);
  const [isFinishOpen, setFinishOpen] = useState(false);
  const [name, setName] = useState('');
  // Ticks once a second purely to re-render the elapsed clock.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!workout || workout.endedAt) return;
    const timer = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [workout]);

  const exercisesById = useMemo(
    () => new Map(EXERCISE_CATALOGUE.map((entry) => [entry.id, entry])),
    [],
  );

  const unit: 'kg' | 'lb' = profile?.unitSystem === 'imperial' ? 'lb' : 'kg';

  if (!workout) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.dashboard.backdrop,
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <Stack gap="lg" align="center">
          <Text variant="heading" align="center">
            No workout in progress
          </Text>
          <Button label="Back to Training" onPress={onExit} fullWidth={false} />
        </Stack>
      </View>
    );
  }

  const metrics = workoutMetrics({
    workout,
    exercisesById,
    // Bodyweight is not on the profile yet, so the calorie estimate stays at
    // zero rather than being computed from an invented mass.
    bodyweightKg: null,
  });

  const volumeDisplay =
    unit === 'kg'
      ? `${Math.round(metrics.totalVolumeKg).toLocaleString()} kg`
      : `${Math.round(metrics.totalVolumeKg / KG_PER_LB).toLocaleString()} lb`;

  const confirmDiscard = () => {
    const run = () => {
      discard();
      onExit();
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Discard this workout? Logged sets will be lost.')) run();
      return;
    }

    Alert.alert('Discard workout?', 'Every set you logged in this session will be lost.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: run },
    ]);
  };

  const handleFinish = () => {
    const finished = finish(name.trim() || 'Workout');
    setFinishOpen(false);
    if (finished) onFinished(finished);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.dashboard.backdrop }}>
      <View
        style={[
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.dashboard.bodyStroke,
            backgroundColor: 'rgba(11, 18, 32, 0.9)',
          },
          glow(theme.colors.dashboard.glowFaint, 18),
        ]}
      >
        <Stack gap="md" style={{ maxWidth: MAX_WIDTH, width: '100%', alignSelf: 'center' }}>
          <Stack direction="row" align="center" justify="space-between" gap="md">
            <Pressable
              onPress={onExit}
              accessibilityRole="button"
              accessibilityLabel="Back to Training"
              hitSlop={10}
            >
              <Icon name="chevronLeft" size={22} color={theme.colors.textMuted} />
            </Pressable>

            <Text variant="heading">{formatElapsed(metrics.durationSeconds)}</Text>

            <Button
              label="Finish"
              size="sm"
              fullWidth={false}
              disabled={metrics.completedSets === 0}
              onPress={() => setFinishOpen(true)}
            />
          </Stack>

          <Stack direction="row" gap="sm">
            <MetricCell label="volume" value={volumeDisplay} />
            <MetricCell label="sets" value={`${metrics.completedSets}/${metrics.totalSets}`} />
            <MetricCell label="exercises" value={String(workout.exercises.length)} />
          </Stack>
        </Stack>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing['3xl'],
          gap: theme.spacing.lg,
          maxWidth: MAX_WIDTH,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {workout.exercises.length === 0 ? (
          <Stack gap="sm" style={{ paddingVertical: theme.spacing['2xl'] }}>
            <Text variant="heading" align="center">
              Nothing added yet
            </Text>
            <Text variant="body" color="muted" align="center">
              Add your first exercise to start logging sets.
            </Text>
          </Stack>
        ) : (
          workout.exercises.map((entry, index) => (
            <ExerciseCard
              key={entry.id}
              entry={entry}
              exercise={exercisesById.get(entry.exerciseId)}
              index={index}
              total={workout.exercises.length}
              unit={unit}
              onMove={reorderExercise}
              onRemove={() => removeExercise(entry.id)}
              onFormCheck={
                findFormCheckExercise(entry.exerciseId)
                  ? () => onOpenFormCheck(entry.exerciseId)
                  : undefined
              }
            />
          ))
        )}

        <Button label="Add exercise" size="lg" onPress={() => setLibraryOpen(true)} />

        <Button label="Discard workout" variant="ghost" onPress={confirmDiscard} />
      </ScrollView>

      {isLibraryOpen ? (
        <ExerciseLibrary
          onAdd={(exercise) => {
            haptics.select();
            addExercise(exercise.id);
            setLibraryOpen(false);
          }}
          onClose={() => setLibraryOpen(false)}
        />
      ) : null}

      {isFinishOpen ? (
        <Panel
          title="Finish workout"
          subtitle={`${metrics.completedSets} sets · ${formatElapsed(metrics.durationSeconds)}`}
          onClose={() => setFinishOpen(false)}
        >
          <Stack gap="sm">
            <Text variant="callout">Workout name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Upper Body"
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Workout name"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.dashboard.bodyStroke,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                color: theme.colors.text,
                ...theme.typography.body,
              }}
            />
            <Text variant="caption" color="muted">
              Saved to your history and reusable as a routine on the Training tab.
            </Text>
          </Stack>

          <Button label="Save workout" size="lg" onPress={handleFinish} />
        </Panel>
      ) : null}
    </View>
  );
}
