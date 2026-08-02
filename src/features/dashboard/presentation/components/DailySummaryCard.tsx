import Svg, { Circle, Line } from 'react-native-svg';

import { Stack, Text, useTheme } from '@/design-system';
import { GlowCard } from './GlowCard';

/** The reference's node-graph motif, drawn rather than shipped as an asset. */
function SummaryGlyph({ size = 56 }: { size?: number }) {
  const theme = useTheme();
  const points = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
    return { x: 32 + Math.cos(angle) * 24, y: 32 + Math.sin(angle) * 24 };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      {points.map((point, index) => {
        const next = points[(index + 1) % points.length]!;
        return (
          <Line
            key={`edge-${index}`}
            x1={point.x}
            y1={point.y}
            x2={next.x}
            y2={next.y}
            stroke={theme.colors.accent}
            strokeOpacity={0.5}
            strokeWidth={0.8}
          />
        );
      })}
      {points.map((point, index) => (
        <Line
          key={`spoke-${index}`}
          x1={point.x}
          y1={point.y}
          x2={32}
          y2={32}
          stroke={theme.colors.accent}
          strokeOpacity={0.25}
          strokeWidth={0.6}
        />
      ))}
      {points.map((point, index) => (
        <Circle key={`node-${index}`} cx={point.x} cy={point.y} r={2} fill={theme.colors.accent} />
      ))}
    </Svg>
  );
}

export function DailySummaryCard({ summary }: { summary: string }) {
  const theme = useTheme();

  return (
    <GlowCard>
      <Stack direction="row" gap="lg" align="center">
        <Stack gap="sm" flex={1}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.8 }}>
            TODAY’S SUMMARY
          </Text>
          {/* accessibilityLiveRegion so the sentence is re-announced when the
              underlying numbers change rather than silently swapping. */}
          <Text variant="body" accessibilityLiveRegion="polite">
            {summary}
          </Text>
        </Stack>

        <Stack style={{ opacity: 0.9, marginLeft: theme.spacing.sm }}>
          <SummaryGlyph />
        </Stack>
      </Stack>
    </GlowCard>
  );
}
