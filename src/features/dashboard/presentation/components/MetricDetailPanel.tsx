import { View } from 'react-native';

import { Stack, Text, useTheme } from '@/design-system';
import { scoreBand, type DashboardMetrics } from '../../domain/entities/dashboard';
import { explainMetric } from '../../domain/use-cases/explain-metric';
import type { MetricKey } from '../store/dashboard-view';
import { GlowCard } from './GlowCard';
import { Panel } from './Panel';

/** A thin bar standing in for the factor's 0–100 value. */
function FactorBar({ value }: { value: number }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View
      style={{
        height: 4,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: theme.colors.accent,
        }}
      />
    </View>
  );
}

export function MetricDetailPanel({
  metric,
  metrics,
  onClose,
}: {
  metric: MetricKey;
  metrics: DashboardMetrics;
  onClose: () => void;
}) {
  const theme = useTheme();
  const explanation = explainMetric(metric, metrics);

  return (
    <Panel
      title={explanation.title}
      subtitle={scoreBand(metrics[metric])}
      onClose={onClose}
    >
      <Text variant="body">{explanation.headline}</Text>

      <Stack gap="md">
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          WHAT FEEDS THIS
        </Text>

        {explanation.factors.map((factor) => (
          <GlowCard key={factor.label} padding="sm">
            <Stack gap="sm">
              <Stack direction="row" justify="space-between" align="center" gap="md">
                <Text variant="callout" style={{ flex: 1 }}>
                  {factor.label}
                </Text>
                <Text
                  variant="callout"
                  color={factor.value === null ? 'muted' : 'accent'}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {factor.value === null ? 'No data' : `${factor.value}%`}
                </Text>
              </Stack>

              {factor.value === null ? null : <FactorBar value={factor.value} />}

              <Text variant="caption" color="muted">
                {factor.hint}
              </Text>
            </Stack>
          </GlowCard>
        ))}
      </Stack>

      <GlowCard padding="md" active>
        <Stack gap="xs">
          <Text variant="caption" color="accent" style={{ letterSpacing: 0.6 }}>
            SUGGESTION
          </Text>
          <Text variant="body">{explanation.recommendation}</Text>
        </Stack>
      </GlowCard>

      <Text variant="caption" color="muted" style={{ marginTop: theme.spacing.xs }}>
        General wellness guidance, not medical advice.
      </Text>
    </Panel>
  );
}
