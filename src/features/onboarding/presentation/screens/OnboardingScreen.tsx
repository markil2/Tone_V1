import { Pressable } from 'react-native';

import { Button, Screen, Stack, Text, useTheme } from '@/design-system';
import type { CompleteOnboarding } from '../../domain/use-cases/complete-onboarding';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { StepContent } from '../components/StepContent';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import { OnboardingSummary } from './OnboardingSummary';

/**
 * Onboarding flow container.
 *
 * Deliberately one screen with an internal step index rather than seven routes:
 * the draft never touches the URL, back-navigation can't strand a user
 * mid-answer, and the whole flow is one unit to instrument for drop-off.
 */
export function OnboardingScreen({
  onComplete,
  complete,
}: {
  onComplete: () => void;
  /** Overridable for previews and tests. Defaults to the real use-case. */
  complete?: CompleteOnboarding;
}) {
  const theme = useTheme();
  const flow = useOnboardingFlow(complete);

  // A previous user's draft is being cleared; showing their step would be wrong.
  if (!flow.isReady) return null;

  if (flow.result) {
    return <OnboardingSummary result={flow.result} onContinue={onComplete} />;
  }

  return (
    <Screen scroll>
      <Stack gap="2xl" flex={1} style={{ paddingVertical: theme.spacing.xl }}>
        <Stack gap="lg">
          <Stack direction="row" justify="space-between" align="center">
            <Pressable
              onPress={flow.goBack}
              disabled={flow.isFirstStep}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              style={{ opacity: flow.isFirstStep ? 0 : 1 }}
            >
              <Text variant="callout" color="muted">
                ← Back
              </Text>
            </Pressable>

            <Text variant="caption" color="muted">
              About a minute
            </Text>
          </Stack>

          <OnboardingProgress stepIndex={flow.stepIndex} />
        </Stack>

        <Stack gap="sm">
          <Text variant="title">{flow.step.title}</Text>
          {flow.step.subtitle ? (
            <Text variant="body" color="muted">
              {flow.step.subtitle}
            </Text>
          ) : null}
        </Stack>

        <Stack flex={1}>
          <StepContent stepId={flow.step.id} onAutoAdvance={flow.autoAdvance} />
        </Stack>

        <Stack gap="md">
          {flow.error ? (
            <Text variant="caption" color="danger" align="center">
              {flow.error}
            </Text>
          ) : null}

          {/* Auto-advancing steps still show Continue once answered, so a user
              who taps to change their mind has an obvious way forward. */}
          <Button
            label={flow.isLastStep ? 'Create my plan' : 'Continue'}
            size="lg"
            onPress={flow.advance}
            disabled={!flow.canContinue}
            loading={flow.isSubmitting}
          />
        </Stack>
      </Stack>
    </Screen>
  );
}
