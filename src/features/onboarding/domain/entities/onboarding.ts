import type { UnitSystem } from '@/shared/units';

/**
 * Onboarding domain model.
 *
 * Every field here must earn its place by changing something the user can see —
 * a calorie target, a hydration goal, which tabs appear. Questions that only
 * satisfy curiosity cost conversion and are deliberately excluded.
 */

export const PRIMARY_GOALS = [
  'lose_weight',
  'build_muscle',
  'improve_performance',
  'maintain_fitness',
] as const;
export type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

/**
 * Biological sex, not gender identity.
 *
 * This is asked because BMR equations (Mifflin-St Jeor) are calibrated on it —
 * it is a physiological input, and the UI says so explicitly. Gender identity is
 * a separate concern and does not belong in a metabolic calculation.
 */
export const BIOLOGICAL_SEXES = ['male', 'female'] as const;
export type BiologicalSex = (typeof BIOLOGICAL_SEXES)[number];

export const ACTIVITY_LEVELS = ['sedentary', 'moderately_active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

/** Which pillars the user wants surfaced. Drives dashboard composition. */
export const TRACKING_PILLARS = [
  'nutrition',
  'hydration',
  'sleep',
  'training',
  'recovery',
] as const;
export type TrackingPillar = (typeof TRACKING_PILLARS)[number];

/** Answers collected during the flow. */
export type OnboardingAnswers = {
  primaryGoal: PrimaryGoal;
  biologicalSex: BiologicalSex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  trainingDaysPerWeek: number;
  focus: TrackingPillar[];
  unitSystem: UnitSystem;
};

/** Derived daily targets — the payoff the user sees at the end of the flow. */
export type DailyTargets = {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  sleepMinutes: number;
  /** True when the calorie floor clamped the deficit. Surfaced to the user. */
  clampedToFloor: boolean;
};

export type OnboardingResult = {
  answers: OnboardingAnswers;
  targets: DailyTargets;
};
