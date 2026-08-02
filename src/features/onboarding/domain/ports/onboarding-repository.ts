import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { DailyTargets, OnboardingAnswers } from '../entities/onboarding';

export type OnboardingRepository = {
  /**
   * Persists answers and derived targets together, atomically.
   *
   * Atomicity is the whole point: a partial write leaves a profile that is
   * onboarded but has no targets, which every dashboard would then have to
   * defend against forever.
   */
  complete(input: {
    answers: OnboardingAnswers;
    targets: DailyTargets;
  }): Promise<Result<void, AppError>>;
};
