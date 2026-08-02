import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { Profile } from '../entities/profile';
import type { UserTargets } from '../entities/targets';

export type ProfileRepository = {
  /** Null when the trigger-created row is not yet visible (rare, first sign-up). */
  getById(userId: string): Promise<Result<Profile | null, AppError>>;

  /** Null until onboarding completes and writes the first target set. */
  getTargets(userId: string): Promise<Result<UserTargets | null, AppError>>;
};
