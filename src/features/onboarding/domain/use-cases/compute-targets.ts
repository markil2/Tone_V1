import type {
  ActivityLevel,
  BiologicalSex,
  DailyTargets,
  OnboardingAnswers,
  PrimaryGoal,
} from '../entities/onboarding';

/**
 * Turns onboarding answers into daily targets.
 *
 * Pure and dependency-free: no network, no clock, no Supabase. That makes it
 * exhaustively unit-testable and lets the same function run on the watch, in an
 * Edge Function, or in the AI insight pipeline without modification.
 *
 * This is the entire justification for asking the six required questions — each
 * one is an input below.
 */

/** Mifflin-St Jeor — better population accuracy than Harris-Benedict. */
function basalMetabolicRate(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  biologicalSex: BiologicalSex;
}): number {
  const { weightKg, heightCm, age, biologicalSex } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (biologicalSex === 'male' ? 5 : -161);
}

/**
 * Activity multipliers.
 *
 * Note that `trainingDaysPerWeek` deliberately does NOT feed this calculation.
 * Users report training days *and* pick an activity level that already accounts
 * for them; combining both systematically over-estimates TDEE. Training days
 * personalise programming and recovery instead.
 */
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  moderately_active: 1.55,
  very_active: 1.725,
};

/** Calorie adjustment as a proportion of TDEE. */
const GOAL_ADJUSTMENT: Record<PrimaryGoal, number> = {
  lose_weight: -0.2, // ~0.5 kg/week for most people, sustainable
  build_muscle: +0.1, // lean surplus; larger surpluses mostly add fat
  improve_performance: +0.05, // fuel the work without meaningful gain
  maintain_fitness: 0,
};

/** Protein in g/kg bodyweight. Highest in a deficit, to protect lean mass. */
const PROTEIN_PER_KG: Record<PrimaryGoal, number> = {
  lose_weight: 2.2,
  build_muscle: 2.0,
  improve_performance: 1.8,
  maintain_fitness: 1.6,
};

/**
 * Absolute calorie floors.
 *
 * A safety guardrail, not a tuning knob: an aggressive deficit on top of a low
 * TDEE can otherwise produce a target low enough to be genuinely unsafe. When
 * this clamps, we tell the user rather than silently serving a different number.
 */
const CALORIE_FLOOR: Record<BiologicalSex, number> = {
  male: 1500,
  female: 1200,
};

const FAT_CALORIE_SHARE = 0.25;
const MIN_FAT_PER_KG = 0.6; // below roughly this, hormonal function suffers
const CALORIES_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export function computeDailyTargets(answers: OnboardingAnswers): DailyTargets {
  const { weightKg, heightCm, age, biologicalSex, activityLevel, primaryGoal } = answers;

  const bmr = basalMetabolicRate({ weightKg, heightCm, age, biologicalSex });
  const tdee = bmr * ACTIVITY_FACTOR[activityLevel];

  // Protein and fat are set first because both have physiological minimums;
  // carbohydrate absorbs whatever remains.
  const proteinG = Math.round(weightKg * PROTEIN_PER_KG[primaryGoal]);
  const minFatG = weightKg * MIN_FAT_PER_KG;

  /**
   * The floor is whichever is higher: the absolute safety minimum, or what this
   * user's protein and essential-fat requirements already cost.
   *
   * Without the second term the two are computed independently and can exceed
   * the calorie target — a heavy user in a deficit gets 2.2 g/kg protein plus
   * minimum fat totalling more than their allowance, carbohydrate clamps to
   * zero, and the summary screen shows macros that visibly contradict the
   * calorie number above them. A target below your own macro minimums is not a
   * meaningful target.
   */
  const macroFloor = proteinG * CALORIES_PER_G.protein + minFatG * CALORIES_PER_G.fat;
  const floor = Math.max(CALORIE_FLOOR[biologicalSex], macroFloor);

  const adjusted = tdee * (1 + GOAL_ADJUSTMENT[primaryGoal]);
  const clampedToFloor = adjusted < floor;
  const calories = Math.round(clampedToFloor ? floor : adjusted);

  // Fat is the greater of 25% of calories and the physiological minimum, but
  // never more than the calorie budget leaves after protein. The floor above
  // guarantees that headroom is at least minFatG, so this can't starve fat.
  const fatHeadroomG =
    (calories - proteinG * CALORIES_PER_G.protein) / CALORIES_PER_G.fat;
  const fatG = Math.round(
    Math.min(
      Math.max((calories * FAT_CALORIE_SHARE) / CALORIES_PER_G.fat, minFatG),
      fatHeadroomG,
    ),
  );

  const remaining =
    calories - proteinG * CALORIES_PER_G.protein - fatG * CALORIES_PER_G.fat;
  const carbsG = Math.max(0, Math.round(remaining / CALORIES_PER_G.carbs));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    proteinG,
    carbsG,
    fatG,
    waterMl: computeWaterTarget(answers),
    sleepMinutes: computeSleepTarget(answers),
    clampedToFloor,
  };
}

/**
 * Hydration ceiling.
 *
 * The same reasoning as CALORIE_FLOOR, in the other direction: 35 ml/kg is a
 * sound rule of thumb until bodyweight is high, where it produces targets in
 * the 8-9 L range. Sustained intake at that level carries real hyponatremia
 * risk, and the app presents this number as a daily goal to hit — so it needs a
 * bound. Generous enough that only extreme cases are affected.
 */
const WATER_CEILING_ML = 5000;

/** 35 ml/kg baseline, plus a training-day allowance for sweat losses. */
function computeWaterTarget({ weightKg, trainingDaysPerWeek }: OnboardingAnswers): number {
  const base = weightKg * 35;
  const trainingBonus = (trainingDaysPerWeek / 7) * 500;
  const target = Math.min(base + trainingBonus, WATER_CEILING_ML);
  return Math.round(target / 50) * 50; // round to a tidy 50 ml
}

/**
 * 8h baseline; heavy training loads raise sleep need.
 *
 * Exported on its own because the dashboard needs the same answer when seeding a
 * user whose stored targets haven't loaded yet. Two copies of this rule would
 * drift, and the resulting mismatch — a sleep goal that differs between the
 * onboarding summary and the dashboard — is exactly the kind of inconsistency
 * that makes every other number look untrustworthy.
 */
export function sleepTargetForTrainingDays(trainingDaysPerWeek: number): number {
  if (trainingDaysPerWeek >= 5) return 8.5 * 60;
  if (trainingDaysPerWeek >= 3) return 8 * 60;
  return 7.5 * 60;
}

function computeSleepTarget({ trainingDaysPerWeek }: OnboardingAnswers): number {
  return sleepTargetForTrainingDays(trainingDaysPerWeek);
}
