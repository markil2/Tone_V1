import { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { supabase } from '@/lib/supabase';
import type { TrackingPillar } from '@/features/onboarding';
import type { Profile } from '../domain/entities/profile';
import type { UserTargets } from '../domain/entities/targets';
import type { ProfileRepository } from '../domain/ports/profile-repository';

type ProfileRow = {
  id: string;
  display_name: string | null;
  unit_system: 'metric' | 'imperial';
  timezone: string;
  primary_goal: Profile['primaryGoal'];
  biological_sex: Profile['biologicalSex'];
  birth_year: number | null;
  height_cm: number | null;
  activity_level: Profile['activityLevel'];
  training_days_per_week: number | null;
  focus: string[] | null;
  onboarded_at: string | null;
};

type TargetsRow = {
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  sleep_minutes: number;
  effective_from: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    unitSystem: row.unit_system,
    timezone: row.timezone,
    primaryGoal: row.primary_goal,
    biologicalSex: row.biological_sex,
    birthYear: row.birth_year,
    heightCm: row.height_cm,
    activityLevel: row.activity_level,
    trainingDaysPerWeek: row.training_days_per_week,
    focus: (row.focus ?? []) as TrackingPillar[],
    isOnboarded: row.onboarded_at !== null,
  };
}

export function createSupabaseProfileRepository(): ProfileRepository {
  return {
    async getById(userId: string): Promise<Result<Profile | null, AppError>> {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, display_name, unit_system, timezone, primary_goal, biological_sex, birth_year, height_cm, activity_level, training_days_per_week, focus, onboarded_at',
        )
        .eq('id', userId)
        // maybeSingle, not single: a missing row is a legitimate state on first
        // sign-up, not an error to surface to the user.
        .maybeSingle();

      if (error) {
        return err(
          new AppError({
            code: 'unknown',
            message: error.message,
            userMessage: "We couldn't load your profile.",
            cause: error,
          }),
        );
      }

      return ok(data ? toProfile(data as ProfileRow) : null);
    },

    async getTargets(userId: string): Promise<Result<UserTargets | null, AppError>> {
      // current_targets is a view over user_targets that already picks the most
      // recent row per user, so there is no ordering to get wrong here.
      const { data, error } = await supabase
        .from('current_targets')
        .select('calorie_target, protein_g, carbs_g, fat_g, water_ml, sleep_minutes, effective_from')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return err(
          new AppError({
            code: 'unknown',
            message: error.message,
            userMessage: "We couldn't load your daily targets.",
            cause: error,
          }),
        );
      }

      if (!data) return ok(null);

      const row = data as TargetsRow;
      return ok({
        calories: row.calorie_target,
        proteinG: row.protein_g,
        carbsG: row.carbs_g,
        fatG: row.fat_g,
        waterMl: row.water_ml,
        sleepMinutes: row.sleep_minutes,
        effectiveFrom: row.effective_from,
      });
    },
  };
}
