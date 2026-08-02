import { z } from 'zod';

import {
  ACTIVITY_LEVELS,
  BIOLOGICAL_SEXES,
  PRIMARY_GOALS,
  TRACKING_PILLARS,
} from '../entities/onboarding';

/**
 * Bounds are physiological limits, not UI ranges — they exist to reject
 * impossible data before it reaches the database, where it would poison every
 * downstream average and AI insight.
 */
export const AGE_RANGE = { min: 13, max: 100, step: 1, default: 30 } as const;
export const HEIGHT_CM_RANGE = { min: 120, max: 220, step: 1, default: 175 } as const;
export const WEIGHT_KG_RANGE = { min: 30, max: 250, step: 0.5, default: 75 } as const;
export const TRAINING_DAYS_RANGE = { min: 0, max: 7, step: 1, default: 3 } as const;

export const onboardingAnswersSchema = z.object({
  primaryGoal: z.enum(PRIMARY_GOALS),
  biologicalSex: z.enum(BIOLOGICAL_SEXES),
  age: z.number().int().min(AGE_RANGE.min).max(AGE_RANGE.max),
  heightCm: z.number().min(HEIGHT_CM_RANGE.min).max(HEIGHT_CM_RANGE.max),
  weightKg: z.number().min(WEIGHT_KG_RANGE.min).max(WEIGHT_KG_RANGE.max),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  trainingDaysPerWeek: z
    .number()
    .int()
    .min(TRAINING_DAYS_RANGE.min)
    .max(TRAINING_DAYS_RANGE.max),
  focus: z.array(z.enum(TRACKING_PILLARS)).min(1, {
    error: 'Pick at least one area to track.',
  }),
  unitSystem: z.enum(['metric', 'imperial']),
});

export type ValidatedAnswers = z.infer<typeof onboardingAnswersSchema>;
