import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { container } from '@/bootstrap/container';
import { AppError } from '@/core/errors';
import { isErr } from '@/core/result';
import { useSession } from '@/features/auth';
import { haptics } from '@/shared/haptics';
import type { OnboardingResult } from '../../domain/entities/onboarding';
import type { CompleteOnboarding } from '../../domain/use-cases/complete-onboarding';
import { STEPS } from '../config/steps';
import { useOnboardingDraft } from '../store/onboarding-draft';

/**
 * View-model for the onboarding flow.
 *
 * Holds all navigation and submission logic so the screen is purely
 * presentational — and so the step sequence can be reordered in config/steps.ts
 * without touching either.
 *
 * `complete` is injectable. It defaults to the wired-up use-case, but a preview
 * or a test can pass one backed by an in-memory repository and exercise the real
 * validation and target maths with no network. This is what the port abstraction
 * was for.
 */
export function useOnboardingFlow(
  complete: CompleteOnboarding = container.onboarding.complete,
) {
  const queryClient = useQueryClient();
  const draft = useOnboardingDraft();
  const { stepIndex, goNext, goBack, ownerId, resetFor } = draft;
  const { userId } = useSession();

  /**
   * Bind the draft to the signed-in user, clearing it if the owner changed.
   *
   * The store is a module singleton that outlives sign-out, so without this a
   * second user on the same device inherits the first user's answers and step
   * position. `isReady` gates rendering for the one frame before the reset
   * lands, so a stale step is never shown.
   */
  const isStale = userId !== null && userId !== ownerId;

  useEffect(() => {
    if (isStale) resetFor(userId);
  }, [isStale, userId, resetFor]);

  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const step = STEPS[stepIndex]!;
  const isLastStep = stepIndex === STEPS.length - 1;
  const canContinue = useMemo(() => step.isAnswered(draft), [step, draft]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      const outcome = await complete(useOnboardingDraft.getState().toAnswers());

      if (isErr(outcome)) {
        haptics.error();
        setError(outcome.error.userMessage);
        return;
      }

      haptics.success();
      // The route guard reads the profile to decide whether onboarding is done,
      // so that cache must be dropped before we navigate away.
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setResult(outcome.value);
    } catch (cause) {
      haptics.error();
      setError(AppError.from(cause).userMessage);
    } finally {
      setSubmitting(false);
    }
  }, [queryClient, complete]);

  /** Advance, or submit if this was the final question. */
  const advance = useCallback(() => {
    if (isLastStep) {
      void submit();
      return;
    }
    goNext(STEPS.length);
  }, [isLastStep, submit, goNext]);

  /**
   * Auto-advance for single-tap choices. Suppressed on the last step so a tap
   * never submits the whole flow without an explicit confirmation.
   */
  const autoAdvance = useCallback(() => {
    if (!step.autoAdvance || isLastStep) return;
    goNext(STEPS.length);
  }, [step.autoAdvance, isLastStep, goNext]);

  return {
    // False only while a stale draft is being cleared — see isStale above.
    isReady: !isStale,
    step,
    stepIndex,
    totalSteps: STEPS.length,
    isFirstStep: stepIndex === 0,
    isLastStep,
    canContinue,
    isSubmitting,
    error,
    result,
    advance,
    autoAdvance,
    goBack,
  };
}
