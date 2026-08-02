import { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import type { OnboardingAnswers, OnboardingResult } from '../entities/onboarding';
import type { OnboardingRepository } from '../ports/onboarding-repository';
import { computeDailyTargets } from './compute-targets';
import { onboardingAnswersSchema } from './validation';

/**
 * Validate → compute → persist.
 *
 * Targets are computed here rather than in the UI so that the same numbers are
 * produced no matter what triggers a recalculation later (a weight change, a
 * goal change, a background job).
 */
export function makeCompleteOnboarding(repository: OnboardingRepository) {
  return async (
    input: Partial<OnboardingAnswers>,
  ): Promise<Result<OnboardingResult, AppError>> => {
    const parsed = onboardingAnswersSchema.safeParse(input);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(
        new AppError({
          code: 'validation',
          message: `Invalid onboarding answers: ${issue?.path.join('.')}`,
          userMessage: issue?.message ?? 'Some answers are missing.',
        }),
      );
    }

    const answers: OnboardingAnswers = parsed.data;
    const targets = computeDailyTargets(answers);

    const saved = await repository.complete({ answers, targets });
    if (!saved.ok) return err(saved.error);

    return ok({ answers, targets });
  };
}

export type CompleteOnboarding = ReturnType<typeof makeCompleteOnboarding>;
