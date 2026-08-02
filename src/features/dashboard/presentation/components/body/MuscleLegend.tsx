import { View } from 'react-native';

import { Stack, Text, useTheme } from '@/design-system';
import { MUSCLE_STATUS_LABELS, type BodyView } from '../../../domain/entities/dashboard';
import { BALANCED_AT, RECOVERED_AT } from '../../../domain/use-cases/muscle-status';

type LegendEntry = { color: string; label: string; detail: string };

/**
 * The key for whatever the body is currently coloured by.
 *
 * Exists because the body map encodes data as colour, and colour alone is not an
 * accessible channel. Every band is spelled out in words with its numeric
 * threshold, so the map is still readable if the hues are indistinguishable.
 */
export function MuscleLegend({ view }: { view: BodyView }) {
  const theme = useTheme();

  if (view !== 'muscles' && view !== 'recovery') return null;

  const entries: LegendEntry[] =
    view === 'recovery'
      ? [
          {
            color: theme.colors.dashboard.muscle.recovered,
            label: MUSCLE_STATUS_LABELS.recovered,
            detail: `${RECOVERED_AT}%+`,
          },
          {
            color: theme.colors.dashboard.muscle.balanced,
            label: MUSCLE_STATUS_LABELS.balanced,
            detail: `${BALANCED_AT}–${RECOVERED_AT - 1}%`,
          },
          {
            color: theme.colors.dashboard.muscle.fatigued,
            label: MUSCLE_STATUS_LABELS.fatigued,
            detail: `under ${BALANCED_AT}%`,
          },
        ]
      : [
          { color: theme.colors.accent, label: 'Light load', detail: 'under 40%' },
          { color: theme.colors.accent, label: 'Moderate load', detail: '40–69%' },
          { color: theme.colors.accent, label: 'Heavy load', detail: '70%+' },
        ];

  // In load mode the hue is constant and only density changes, so the swatches
  // step in opacity to match what the body map actually does.
  const opacityFor = (index: number) => (view === 'muscles' ? 0.25 + index * 0.3 : 1);

  return (
    <View
      accessible
      accessibilityLabel={`Legend: body coloured by ${
        view === 'recovery' ? 'recovery status' : 'training load'
      }`}
    >
      <Stack direction="row" gap="lg" wrap justify="center">
        {entries.map((entry, index) => (
          <Stack key={entry.label} direction="row" gap="xs" align="center">
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: theme.radius.full,
                backgroundColor: entry.color,
                opacity: opacityFor(index),
              }}
            />
            <Text variant="caption" color="muted">
              {entry.label}
            </Text>
            <Text variant="caption" color="muted" style={{ opacity: 0.6 }}>
              {entry.detail}
            </Text>
          </Stack>
        ))}
      </Stack>
    </View>
  );
}
