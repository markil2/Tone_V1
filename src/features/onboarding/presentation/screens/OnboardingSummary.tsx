import { View } from 'react-native';

import { Button, Card, Screen, Stack, Text, useTheme } from '@/design-system';
import { formatVolume } from '@/shared/units';
import type { OnboardingResult } from '../../domain/entities/onboarding';

/**
 * The payoff screen.
 *
 * Shown immediately after saving, because a flow that ends by dumping the user
 * on an empty dashboard makes the questions feel extractive. Seeing numbers
 * derived from their own answers is what justifies having asked.
 */
export function OnboardingSummary({
  result,
  onContinue,
}: {
  result: OnboardingResult;
  onContinue: () => void;
}) {
  const theme = useTheme();
  const { targets, answers } = result;

  const macros = [
    { label: 'Protein', value: `${targets.proteinG}g`, color: theme.colors.domain.training },
    { label: 'Carbs', value: `${targets.carbsG}g`, color: theme.colors.domain.nutrition },
    { label: 'Fat', value: `${targets.fatG}g`, color: theme.colors.domain.sleep },
  ];

  return (
    <Screen scroll>
      <Stack gap="2xl" style={{ paddingVertical: theme.spacing['2xl'] }}>
        <Stack gap="sm">
          <Text variant="caption" color="accent">
            YOU’RE ALL SET
          </Text>
          <Text variant="display">Your daily targets</Text>
          <Text variant="body" color="muted">
            Calculated from your answers. These adjust automatically as your weight
            and training change.
          </Text>
        </Stack>

        <Card elevated accent="nutrition">
          <Stack gap="xs">
            <Text variant="caption" color="muted">
              DAILY CALORIES
            </Text>
            <Text variant="metric" style={{ fontVariant: ['tabular-nums'] }}>
              {targets.calories.toLocaleString()}
            </Text>
            <Text variant="caption" color="muted">
              Maintenance is about {targets.tdee.toLocaleString()} kcal
            </Text>
          </Stack>
        </Card>

        <Stack gap="md">
          <Text variant="heading">Macros</Text>
          <Stack direction="row" gap="sm">
            {macros.map((macro) => (
              <Card key={macro.label} padding="md" style={{ flex: 1 }}>
                <Stack gap="xs" align="center">
                  <View
                    style={{
                      width: 24,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: macro.color,
                    }}
                  />
                  <Text variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
                    {macro.value}
                  </Text>
                  <Text variant="caption" color="muted">
                    {macro.label}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" gap="sm">
          <Card padding="md" accent="hydration" style={{ flex: 1 }}>
            <Stack gap="xs">
              <Text variant="caption" color="muted">
                WATER
              </Text>
              <Text variant="heading">
                {formatVolume(targets.waterMl, answers.unitSystem)}
              </Text>
            </Stack>
          </Card>
          <Card padding="md" accent="sleep" style={{ flex: 1 }}>
            <Stack gap="xs">
              <Text variant="caption" color="muted">
                SLEEP
              </Text>
              <Text variant="heading">
                {Math.floor(targets.sleepMinutes / 60)}h{' '}
                {targets.sleepMinutes % 60 > 0 ? `${targets.sleepMinutes % 60}m` : ''}
              </Text>
            </Stack>
          </Card>
        </Stack>

        {/* Shown only when the safety floor overrode the requested deficit —
            silently serving a different number would be dishonest. */}
        {targets.clampedToFloor ? (
          <Card padding="md">
            <Text variant="caption" color="muted">
              We raised your calorie target to a safe minimum. A steeper deficit
              than this isn’t something we’ll recommend.
            </Text>
          </Card>
        ) : null}

        <Stack gap="sm">
          <Button label="Start tracking" size="lg" onPress={onContinue} />
          <Text variant="caption" color="muted" align="center">
            Estimates based on the Mifflin-St Jeor equation. Not medical advice.
          </Text>
        </Stack>
      </Stack>
    </Screen>
  );
}
