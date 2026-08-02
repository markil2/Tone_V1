import { Pressable, View } from 'react-native';

import { Icon, Stack, Text, useTheme } from '@/design-system';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { formatDuration, type DashboardMetrics } from '../../domain/entities/dashboard';
import { glow } from './GlowCard';

export function SleepCard({
  metrics,
  onPress,
}: {
  metrics: DashboardMetrics;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`Sleep, ${metrics.sleepScore} percent. ${formatDuration(
        metrics.sleepDurationMinutes,
      )} total, ${formatDuration(metrics.deepSleepMinutes)} deep, recovery ${
        metrics.recoveryChange >= 0 ? 'up' : 'down'
      } ${Math.abs(metrics.recoveryChange)} points.`}
      accessibilityHint="Opens the full sleep breakdown"
      style={({ pressed }) => [
        {
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
          overflow: 'hidden',
          opacity: pressed ? 0.85 : 1,
        },
        isFocused ? glow(theme.colors.dashboard.glowSoft, 12) : null,
      ]}
    >
      {/* The reference puts a night scene behind the score. Rendered as a flat
          gradient-free band rather than an image, so there is no asset to ship
          and nothing to go blurry at arbitrary card widths. */}
      <Stack
        direction="row"
        align="center"
        justify="space-between"
        gap="md"
        style={{
          backgroundColor: 'rgba(41, 37, 87, 0.55)',
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
        }}
      >
        <Icon name="moon" size={28} color={theme.colors.text} />
        <Stack direction="row" align="baseline" gap="xs">
          <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>
            {metrics.sleepScore}
          </Text>
          <Text variant="caption" color="muted">
            %
          </Text>
        </Stack>
        <Text variant="callout" color="muted">
          Sleep
        </Text>
      </Stack>

      <View style={{ backgroundColor: 'rgba(11, 18, 32, 0.72)', padding: theme.spacing.lg }}>
        <Stack gap="sm">
          <Row label="Sleep" value={formatDuration(metrics.sleepDurationMinutes)} />
          <Row label="Deep" value={formatDuration(metrics.deepSleepMinutes)} />
          <Row
            label="Recovery"
            value={`${metrics.recoveryChange >= 0 ? '+' : ''}${metrics.recoveryChange}`}
            accent
          />
        </Stack>
      </View>
    </Pressable>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Stack direction="row" justify="space-between" align="center" gap="md">
      <Text variant="callout" color="muted">
        {label}
      </Text>
      <Text
        variant="callout"
        color={accent ? 'accent' : 'default'}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </Stack>
  );
}
