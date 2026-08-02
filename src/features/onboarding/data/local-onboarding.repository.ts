import type { AppError } from '@/core/errors';
import { isErr, ok, type Result } from '@/core/result';
import { getLocalUserId, localKeys, writeJson } from '@/lib/local-store';
import type { DailyTargets, OnboardingAnswers } from '../domain/entities/onboarding';
import type { OnboardingRepository } from '../domain/ports/onboarding-repository';

/**
 * Survey completion, written to device storage.
 *
 * The Supabase adapter gets its user id from `auth.uid()` inside the RPC, which
 * is why the port takes no userId. With no auth there is no such context, so
 * this reads the device identity itself — the same id every other local
 * repository namespaces by.
 *
 * The port promises atomicity, and two AsyncStorage writes cannot be atomic.
 * Targets are written first and the profile second, so a crash between them
 * leaves an un-onboarded profile with orphaned targets — the survey simply runs
 * again and overwrites them. The opposite order would produce the state the port
 * exists to prevent: onboarded, with no targets for any screen to read.
 */
export function createLocalOnboardingRepository(): OnboardingRepository {
  return {
    async complete({
      answers,
      targets,
    }: {
      answers: OnboardingAnswers;
      targets: DailyTargets;
    }): Promise<Result<void, AppError>> {
      const userId = await getLocalUserId();

      const savedTargets = await writeJson(localKeys.targets(userId), {
        calories: targets.calories,
        proteinG: targets.proteinG,
        carbsG: targets.carbsG,
        fatG: targets.fatG,
        waterMl: targets.waterMl,
        sleepMinutes: targets.sleepMinutes,
        effectiveFrom: new Date().toISOString().slice(0, 10),
      });
      if (isErr(savedTargets)) return savedTargets;

      const savedProfile = await writeJson(localKeys.profile(userId), {
        id: userId,
        displayName: null,
        unitSystem: answers.unitSystem,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
        primaryGoal: answers.primaryGoal,
        biologicalSex: answers.biologicalSex,
        // Birth year rather than age, matching the database — age would go stale.
        birthYear: new Date().getFullYear() - answers.age,
        heightCm: answers.heightCm,
        activityLevel: answers.activityLevel,
        trainingDaysPerWeek: answers.trainingDaysPerWeek,
        focus: answers.focus,
        isOnboarded: true,
      });
      if (isErr(savedProfile)) return savedProfile;

      return ok(undefined);
    },
  };
}
