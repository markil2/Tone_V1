import { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { supabase } from '@/lib/supabase';
import type { DailyTargets, OnboardingAnswers } from '../domain/entities/onboarding';
import type { OnboardingRepository } from '../domain/ports/onboarding-repository';

export function createSupabaseOnboardingRepository(): OnboardingRepository {
  return {
    async complete({
      answers,
      targets,
    }: {
      answers: OnboardingAnswers;
      targets: DailyTargets;
    }): Promise<Result<void, AppError>> {
      // A single RPC so the profile update and the targets row commit together.
      // See supabase/migrations/0001_init.sql.
      const { error } = await supabase.rpc('complete_onboarding', {
        p_primary_goal: answers.primaryGoal,
        p_biological_sex: answers.biologicalSex,
        // Storing birth year rather than age keeps the value correct as time
        // passes; asking for age is simply faster than asking for a birth date.
        p_birth_year: new Date().getFullYear() - answers.age,
        p_height_cm: answers.heightCm,
        p_weight_kg: answers.weightKg,
        p_activity_level: answers.activityLevel,
        p_training_days_per_week: answers.trainingDaysPerWeek,
        p_focus: answers.focus,
        p_unit_system: answers.unitSystem,
        p_calorie_target: targets.calories,
        p_protein_g: targets.proteinG,
        p_carbs_g: targets.carbsG,
        p_fat_g: targets.fatG,
        p_water_ml: targets.waterMl,
        p_sleep_minutes: targets.sleepMinutes,
      });

      if (error) {
        return err(
          new AppError({
            code: error.code === 'PGRST301' ? 'unauthorized' : 'unknown',
            message: error.message,
            userMessage: "We couldn't save your profile. Please try again.",
            cause: error,
          }),
        );
      }

      return ok(undefined);
    },
  };
}
