import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import { localKeys, readJson } from '@/lib/local-store';
import type { Profile } from '../domain/entities/profile';
import type { UserTargets } from '../domain/entities/targets';
import type { ProfileRepository } from '../domain/ports/profile-repository';

/**
 * The profile, read from device storage.
 *
 * Mirrors the Supabase adapter's contract exactly, including the important
 * detail that a missing row is `null` rather than an error — before the survey
 * is completed there genuinely is no profile, and the route guard depends on
 * being able to tell that apart from a failure.
 */
export function createLocalProfileRepository(): ProfileRepository {
  return {
    async getById(userId: string): Promise<Result<Profile | null, AppError>> {
      return readJson<Profile>(localKeys.profile(userId));
    },

    async getTargets(userId: string): Promise<Result<UserTargets | null, AppError>> {
      return readJson<UserTargets>(localKeys.targets(userId));
    },
  };
}
