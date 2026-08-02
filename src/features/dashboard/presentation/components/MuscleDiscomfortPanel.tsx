import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Icon, Stack, Text, useTheme } from '@/design-system';
import {
  MUSCLE_IDS,
  MUSCLE_LABELS,
  type MuscleId,
} from '../../domain/entities/muscles';
import type { DashboardMetrics, MuscleData } from '../../domain/entities/dashboard';
import { formatLastTrained } from '../../domain/entities/dashboard';
import { GlowCard } from './GlowCard';
import { Panel } from './Panel';

type Severity = 'mild' | 'moderate' | 'severe';
type Feeling = 'sore' | 'tight' | 'sharp' | 'weak';

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={{
        borderWidth: 1,
        borderColor: active ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
        backgroundColor: active ? theme.colors.dashboard.glowFaint : 'transparent',
        borderRadius: theme.radius.full,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
      }}
    >
      <Text variant="caption" color={active ? 'accent' : 'muted'}>{label}</Text>
    </Pressable>
  );
}

function buildInsights(muscle: MuscleData, metrics: DashboardMetrics, feeling: Feeling) {
  const insights: { title: string; detail: string }[] = [];

  if (muscle.lastTrainedDaysAgo !== null && muscle.lastTrainedDaysAgo <= 2) {
    insights.push({
      title: 'Recent training may be contributing',
      detail: `${muscle.name} were trained ${formatLastTrained(muscle.lastTrainedDaysAgo).toLowerCase()}. Soreness that develops gradually after training can reflect normal tissue stress, especially after new exercises or added volume.`,
    });
  }
  if (muscle.trainingLoad >= 60 || metrics.strain >= 65) {
    insights.push({
      title: 'Intensity or accumulated load may be high',
      detail: `This area’s training load is ${muscle.trainingLoad}% and today’s overall strain is ${metrics.strain}%. Repeated hard sets, short rest, or increasing load quickly can outpace recovery.`,
    });
  }
  if (muscle.recovery < 60 || metrics.recovery < 60) {
    insights.push({
      title: 'Recovery may not be complete',
      detail: `${muscle.name} recovery is ${muscle.recovery}% and overall recovery is ${metrics.recovery}%. Sleep, fueling, hydration, and time between sessions can all affect how a trained area feels.`,
    });
  }
  if (metrics.energyPotential < 55) {
    insights.push({
      title: 'Low energy can change movement quality',
      detail: `Energy potential is ${metrics.energyPotential}%. Fatigue can reduce bracing and control, causing other muscles to compensate during a workout.`,
    });
  }
  if (feeling === 'tight') {
    insights.push({ title: 'Tightness is not always a flexibility problem', detail: 'It can accompany fatigue, guarding, or unfamiliar range of motion. Gentle movement may feel better, but forcing a deep stretch through pain is not recommended.' });
  }
  if (insights.length === 0) {
    insights.push({ title: 'The current training data does not show an obvious load issue', detail: 'Consider whether the movement was new, technique changed, daily activity was unusual, or the discomfort began outside training.' });
  }
  return insights;
}

export function MuscleDiscomfortPanel({
  metrics,
  onClose,
}: {
  metrics: DashboardMetrics;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [muscleId, setMuscleId] = useState<MuscleId | null>(null);
  const [severity, setSeverity] = useState<Severity>('mild');
  const [feeling, setFeeling] = useState<Feeling>('sore');
  const [submitted, setSubmitted] = useState(false);
  const muscle = metrics.muscles.find((entry) => entry.id === muscleId) ?? null;
  const insights = useMemo(
    () => (muscle ? buildInsights(muscle, metrics, feeling) : []),
    [feeling, metrics, muscle],
  );
  const urgentPattern = severity === 'severe' || feeling === 'sharp' || feeling === 'weak';

  return (
    <Panel
      title={submitted ? `${muscle?.name ?? 'Muscle'} check-in` : 'Log muscle discomfort'}
      subtitle={submitted ? 'Possible contributors from your training data' : 'Tell us what you are feeling'}
      onClose={onClose}
    >
      {submitted && muscle ? (
        <>
          <GlowCard active padding="md">
            <Stack direction="row" gap="md" align="center">
              <Icon name="heart" size={22} color={theme.colors.accent} />
              <Stack gap="xs" flex={1}>
                <Text variant="callout">Check-in logged</Text>
                <Text variant="caption" color="muted">{severity} · {feeling} · {new Date().toLocaleDateString()}</Text>
              </Stack>
            </Stack>
          </GlowCard>

          {urgentPattern ? (
            <View style={{ borderWidth: 1, borderColor: theme.colors.danger, borderRadius: theme.radius.lg, padding: theme.spacing.lg }}>
              <Stack gap="sm">
                <Text variant="callout" style={{ color: theme.colors.danger }}>Pause training this area</Text>
                <Text variant="body">Sharp or severe pain, sudden weakness, swelling, deformity, numbness, or pain after a pop is not typical workout soreness. Stop the movement and seek evaluation from a qualified clinician. Seek urgent care for a major injury or rapidly worsening symptoms.</Text>
              </Stack>
            </View>
          ) : null}

          <Stack gap="md">
            {insights.map((entry) => (
              <GlowCard key={entry.title} padding="md">
                <Stack gap="sm">
                  <Text variant="callout">{entry.title}</Text>
                  <Text variant="caption" color="muted">{entry.detail}</Text>
                </Stack>
              </GlowCard>
            ))}
          </Stack>

          <GlowCard padding="md">
            <Stack gap="sm">
              <Text variant="callout">For the next session</Text>
              <Text variant="body">Avoid movements that reproduce pain. If symptoms are mild and improving, consider lowering load or volume and using a comfortable range of motion. Do not use the readiness score to override pain.</Text>
            </Stack>
          </GlowCard>

          <Text variant="caption" color="muted">These are possible contributors, not a diagnosis. Persistent pain, pain at rest, or symptoms that interfere with normal movement deserve professional assessment.</Text>
          <Button label="Done" onPress={onClose} />
          <Button label="Log another area" variant="ghost" onPress={() => { setMuscleId(null); setSubmitted(false); }} />
        </>
      ) : (
        <>
          <Stack gap="sm">
            <Text variant="callout">Where do you feel it?</Text>
            <Stack direction="row" gap="sm" style={{ flexWrap: 'wrap' }}>
              {MUSCLE_IDS.map((id) => <Choice key={id} label={MUSCLE_LABELS[id]} active={id === muscleId} onPress={() => setMuscleId(id)} />)}
            </Stack>
          </Stack>

          <Stack gap="sm">
            <Text variant="callout">What does it feel like?</Text>
            <Stack direction="row" gap="sm" style={{ flexWrap: 'wrap' }}>
              {(['sore', 'tight', 'sharp', 'weak'] as Feeling[]).map((value) => <Choice key={value} label={value[0]!.toUpperCase() + value.slice(1)} active={value === feeling} onPress={() => setFeeling(value)} />)}
            </Stack>
          </Stack>

          <Stack gap="sm">
            <Text variant="callout">How strong is it?</Text>
            <Stack direction="row" gap="sm" wrap>
              {(['mild', 'moderate', 'severe'] as Severity[]).map((value) => <Choice key={value} label={value[0]!.toUpperCase() + value.slice(1)} active={value === severity} onPress={() => setSeverity(value)} />)}
            </Stack>
          </Stack>

          <Text variant="caption" color="muted">The explanation uses current energy, recovery, strain, muscle load, and last-trained timing. These metrics are estimates unless connected to measured data.</Text>
          <Button label="Review possible reasons" disabled={!muscleId} onPress={() => setSubmitted(true)} />
        </>
      )}
    </Panel>
  );
}
