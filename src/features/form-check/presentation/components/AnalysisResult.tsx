import { View } from 'react-native';

import { Button, Icon, Stack, Text, useTheme } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import {
  CUE_SEVERITY_LABELS,
  formatTempo,
  type CueSeverity,
  type FormAnalysis,
} from '../../domain/entities/form-check';

function severityColor(severity: CueSeverity, theme: ReturnType<typeof useTheme>): string {
  if (severity === 'fix') return theme.colors.warning;
  if (severity === 'watch') return theme.colors.accent;
  return theme.colors.dashboard.muscle.recovered;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="xs" align="center" flex={1}>
      <Text variant="title" color="accent" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text variant="caption" color="muted" numberOfLines={1}>
        {label}
      </Text>
    </Stack>
  );
}

/**
 * The result of a form check.
 *
 * The banner is not decoration. When the analysis is generated rather than
 * measured, that has to be the first thing read — a rep count and a list of
 * technique cues look identical whether they came from a pose model or from
 * arithmetic on a stopwatch, and only one of them describes the user's actual
 * lift.
 */
export function AnalysisResult({
  analysis,
  onRedo,
  onDone,
}: {
  analysis: FormAnalysis;
  onRedo: () => void;
  onDone: () => void;
}) {
  const theme = useTheme();
  const isSample = analysis.source === 'sample';

  return (
    <Stack gap="lg">
      {isSample ? (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.md,
            alignItems: 'flex-start',
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.warning,
            backgroundColor: 'rgba(251, 191, 36, 0.08)',
            padding: theme.spacing.lg,
          }}
        >
          <Icon name="info" size={20} color={theme.colors.warning} />
          <Stack gap="xs" flex={1}>
            <Text variant="callout" style={{ color: theme.colors.warning }}>
              Example output — your video was not analysed
            </Text>
            <Text variant="caption" color="muted">
              The rep count below is your recording length divided by a typical rep tempo, and
              the cues are standard coaching points for this lift. Nothing here was measured
              from what you actually did.
            </Text>
          </Stack>
        </View>
      ) : null}

      <GlowCard active>
        <Stack gap="lg">
          <Text variant="heading">{analysis.exerciseName}</Text>
          <Stack direction="row" gap="md">
            <Stat
              label={analysis.repCount === null ? 'reps' : 'reps'}
              value={analysis.repCount === null ? '—' : String(analysis.repCount)}
            />
            <Stat label="duration" value={`${Math.round(analysis.durationSeconds)}s`} />
            <Stat label="per rep" value={formatTempo(analysis.tempoSeconds)} />
          </Stack>
        </Stack>
      </GlowCard>

      <GlowCard>
        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
            SUMMARY
          </Text>
          <Text variant="body">{analysis.summary}</Text>
        </Stack>
      </GlowCard>

      <Stack gap="md">
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          WHAT TO WORK ON
        </Text>

        {analysis.cues.map((cue) => {
          const color = severityColor(cue.severity, theme);

          return (
            <GlowCard key={cue.id} padding="md">
              <Stack gap="sm">
                <Stack direction="row" gap="sm" align="center">
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: theme.radius.full,
                      backgroundColor: color,
                    }}
                  />
                  {/* The severity is spelled out, never colour alone. */}
                  <Text variant="caption" style={{ color }}>
                    {CUE_SEVERITY_LABELS[cue.severity]}
                  </Text>
                </Stack>
                <Text variant="callout">{cue.title}</Text>
                <Text variant="caption" color="muted">
                  {cue.detail}
                </Text>
              </Stack>
            </GlowCard>
          );
        })}
      </Stack>

      <Stack gap="sm">
        <Button label="Record again" onPress={onRedo} />
        <Button label="Done" variant="secondary" onPress={onDone} />
      </Stack>

      <Text variant="caption" color="muted">
        General training guidance, not medical advice. If a movement hurts, stop and speak to a
        qualified coach or clinician.
      </Text>
    </Stack>
  );
}
