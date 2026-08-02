import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isErr } from '@/core/result';
import { Button, FixedThemeProvider, Icon, Stack, Text, useTheme } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import { MUSCLE_GROUP_LABELS } from '@/features/training';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { createSampleFormAnalyzer } from '../../data/sample-form-analyzer';
import {
  FORM_CHECK_EXERCISES,
  type FormAnalysis,
  type FormCheckExercise,
  type Recording,
} from '../../domain/entities/form-check';
import { AnalysisResult } from '../components/AnalysisResult';
import { RecordStep } from '../components/RecordStep';

const MAX_WIDTH = 720;
const analyzer = createSampleFormAnalyzer();

type Phase =
  | { step: 'pick' }
  | { step: 'record'; exercise: FormCheckExercise }
  | { step: 'analyzing'; exercise: FormCheckExercise }
  | { step: 'result'; analysis: FormAnalysis }
  | { step: 'error'; message: string };

function ExerciseRow({
  exercise,
  onSelect,
}: {
  exercise: FormCheckExercise;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onSelect}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`Check form for ${exercise.name}`}
      accessibilityHint={`Watches ${exercise.watchPoints.join(', ').toLowerCase()}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Stack gap="xs" flex={1}>
        <Text variant="callout">{exercise.name}</Text>
        <Text variant="caption" color="muted">
          {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {exercise.watchPoints.length} things to
          watch
        </Text>
      </Stack>
      <Icon name="chevronRight" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export function FormCheckScreen({
  onExit,
  initialExercise,
}: {
  onExit: () => void;
  initialExercise?: FormCheckExercise;
}) {
  return (
    <FixedThemeProvider scheme="dark">
      <FormCheckContent onExit={onExit} initialExercise={initialExercise} />
    </FixedThemeProvider>
  );
}

function FormCheckContent({
  onExit,
  initialExercise,
}: {
  onExit: () => void;
  initialExercise?: FormCheckExercise;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>(
    initialExercise ? { step: 'record', exercise: initialExercise } : { step: 'pick' },
  );

  const handleRecorded = async (exercise: FormCheckExercise, recording: Recording) => {
    setPhase({ step: 'analyzing', exercise });

    const result = await analyzer.analyze({ exercise, recording });

    if (isErr(result)) {
      setPhase({ step: 'error', message: result.error.userMessage });
      return;
    }

    setPhase({ step: 'result', analysis: result.value });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.dashboard.backdrop }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.md,
          paddingBottom: insets.bottom + theme.spacing['2xl'],
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.lg,
          maxWidth: MAX_WIDTH,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Stack direction="row" align="center" gap="md">
          <Pressable
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Back to Training"
            hitSlop={10}
          >
            <Icon name="chevronLeft" size={22} color={theme.colors.textMuted} />
          </Pressable>
          <Stack gap="xs" flex={1}>
            <Text variant="title">Form check</Text>
            <Text variant="caption" color="muted">
              Record a set and get technique feedback
            </Text>
          </Stack>
        </Stack>

        {phase.step === 'pick' ? (
          <Stack gap="lg">
            <GlowCard>
              <Stack gap="sm">
                <Text variant="callout">Which lift?</Text>
                <Text variant="caption" color="muted">
                  These eight have well-understood failure modes, which is what makes
                  feedback worth giving.
                </Text>
              </Stack>
            </GlowCard>

            <GlowCard>
              <Stack gap="xs">
                {FORM_CHECK_EXERCISES.map((exercise, index) => (
                  <View key={exercise.id}>
                    {index > 0 ? (
                      <View style={{ height: 1, backgroundColor: theme.colors.border }} />
                    ) : null}
                    <ExerciseRow
                      exercise={exercise}
                      onSelect={() => setPhase({ step: 'record', exercise })}
                    />
                  </View>
                ))}
              </Stack>
            </GlowCard>
          </Stack>
        ) : null}

        {phase.step === 'record' ? (
          <RecordStep
            exercise={phase.exercise}
            autoStart={initialExercise?.id === phase.exercise.id}
            onBack={() => setPhase({ step: 'pick' })}
            onRecorded={(recording) => void handleRecorded(phase.exercise, recording)}
          />
        ) : null}

        {phase.step === 'analyzing' ? (
          <Stack gap="lg" align="center" style={{ paddingVertical: theme.spacing['3xl'] }}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text variant="callout" color="muted">
              Reviewing your {phase.exercise.name.toLowerCase()}…
            </Text>
          </Stack>
        ) : null}

        {phase.step === 'result' ? (
          <AnalysisResult
            analysis={phase.analysis}
            onRedo={() => setPhase({ step: 'pick' })}
            onDone={onExit}
          />
        ) : null}

        {phase.step === 'error' ? (
          <Stack gap="lg" align="center" style={{ paddingVertical: theme.spacing['2xl'] }}>
            <Text variant="heading" align="center">
              We couldn’t review that clip
            </Text>
            <Text variant="body" color="muted" align="center">
              {phase.message}
            </Text>
            <Button
              label="Try again"
              fullWidth={false}
              onPress={() => setPhase({ step: 'pick' })}
            />
          </Stack>
        ) : null}
      </ScrollView>
    </View>
  );
}
