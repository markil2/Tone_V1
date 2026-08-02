import { Stack, Text } from '@/design-system';
import { formatDuration, type DashboardMetrics } from '../../domain/entities/dashboard';
import { GlowCard } from './GlowCard';
import { Panel, PanelRow } from './Panel';

/**
 * Sections that need data the app does not collect yet.
 *
 * Rendered as explicit "not tracked yet" cards rather than plausible-looking
 * placeholder charts. A fake hypnogram would be indistinguishable from a real
 * one, and sleep staging is exactly the kind of number people make decisions on.
 */
const PENDING_SECTIONS = [
  {
    title: 'Sleep stages',
    body: 'Light, deep and REM breakdown needs per-stage samples from a wearable or Apple Health.',
  },
  {
    title: 'Bedtime consistency',
    body: 'Needs a few weeks of bedtimes before a pattern means anything.',
  },
  {
    title: 'Sleep debt',
    body: 'Accumulates once there is more than one night of history to compare against your goal.',
  },
];

export function SleepDetailPanel({
  metrics,
  onClose,
}: {
  metrics: DashboardMetrics;
  onClose: () => void;
}) {
  const gap = metrics.sleepTargetMinutes - metrics.sleepDurationMinutes;

  return (
    <Panel title="Sleep" subtitle="Last night" onClose={onClose}>
      <GlowCard padding="md" active>
        <Stack gap="sm">
          <Stack direction="row" align="baseline" gap="xs">
            <Text variant="metric" style={{ fontVariant: ['tabular-nums'] }}>
              {metrics.sleepScore}
            </Text>
            <Text variant="body" color="muted">
              % sleep score
            </Text>
          </Stack>
          <Text variant="caption" color="muted">
            {gap > 0
              ? `${formatDuration(gap)} under your ${formatDuration(
                  metrics.sleepTargetMinutes,
                )} goal.`
              : `At or above your ${formatDuration(metrics.sleepTargetMinutes)} goal.`}
          </Text>
        </Stack>
      </GlowCard>

      <Stack>
        <PanelRow label="Total sleep" value={formatDuration(metrics.sleepDurationMinutes)} />
        <PanelRow label="Deep sleep" value={formatDuration(metrics.deepSleepMinutes)} />
        <PanelRow label="Sleep goal" value={formatDuration(metrics.sleepTargetMinutes)} />
        <PanelRow
          label="Recovery impact"
          value={`${metrics.recoveryChange >= 0 ? '+' : ''}${metrics.recoveryChange} pts`}
          hint="Change in your recovery score attributed to last night."
        />
      </Stack>

      <Stack gap="md">
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          NOT TRACKED YET
        </Text>

        {PENDING_SECTIONS.map((section) => (
          <GlowCard key={section.title} padding="sm">
            <Stack gap="xs">
              <Text variant="callout">{section.title}</Text>
              <Text variant="caption" color="muted">
                {section.body}
              </Text>
            </Stack>
          </GlowCard>
        ))}
      </Stack>
    </Panel>
  );
}
