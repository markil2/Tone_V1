/**
 * The daily targets currently in force for a user.
 *
 * A narrower type than onboarding's `DailyTargets`: BMR, TDEE and the
 * floor-clamp flag are inputs to the calculation, interesting only on the screen
 * that just performed it. What gets stored — and what every later screen reads —
 * is the six numbers below, from the `current_targets` view.
 */
export type UserTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  sleepMinutes: number;
  /** The date this target set became active. */
  effectiveFrom: string;
};
