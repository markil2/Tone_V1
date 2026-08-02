import { ScrollView, View } from 'react-native';

import { useTheme } from '@/design-system';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import type { DashboardData } from '../../domain/entities/dashboard';
import type { MetricKey } from '../store/dashboard-view';
import { MetricGauge } from './MetricGauge';

export const METRIC_LABELS: Record<MetricKey, string> = {
  energyPotential: 'Energy potential',
  recovery: 'Recovery',
  strain: 'Strain',
};

const ORDER: MetricKey[] = ['energyPotential', 'recovery', 'strain'];

/**
 * The three headline gauges.
 *
 * On narrow screens they become a horizontal scroller rather than shrinking:
 * three gauges squeezed into 375pt leaves each one too small for the number to
 * stay legible, which defeats the point of a gauge.
 */
export function MetricGaugeRow({
  data,
  onSelect,
}: {
  data: DashboardData;
  onSelect: (metric: MetricKey) => void;
}) {
  const theme = useTheme();
  const { isCompact } = useBreakpoint();

  const gauges = ORDER.map((metric) => (
    <View
      key={metric}
      style={
        isCompact
          ? undefined
          : { flex: 1, borderLeftWidth: metric === 'energyPotential' ? 0 : 1, borderLeftColor: theme.colors.border }
      }
    >
      <MetricGauge
        label={METRIC_LABELS[metric]}
        value={data[metric]}
        size={isCompact ? 120 : 132}
        onPress={() => onSelect(metric)}
      />
    </View>
  ));

  if (isCompact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.lg, paddingHorizontal: theme.spacing.xs }}
        // Each gauge lands centred rather than half-cut at the edge.
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {gauges}
      </ScrollView>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>{gauges}</View>
  );
}
