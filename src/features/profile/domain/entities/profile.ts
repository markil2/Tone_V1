import type { UnitSystem } from '@/shared/units';
import type {
  ActivityLevel,
  BiologicalSex,
  PrimaryGoal,
  TrackingPillar,
} from '@/features/onboarding';

/**
 * The user's profile.
 *
 * Every onboarding answer is nullable: a row exists from the moment of sign-up
 * (created by a database trigger), but is only populated once onboarding
 * completes. `isOnboarded` is the flag the route guard reads.
 */
export type Profile = {
  id: string;
  displayName: string | null;
  unitSystem: UnitSystem;
  timezone: string;

  primaryGoal: PrimaryGoal | null;
  biologicalSex: BiologicalSex | null;
  /**
   * Birth year rather than age, so the value stays correct as time passes.
   * Onboarding asks for age because it is faster, and converts.
   */
  birthYear: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  trainingDaysPerWeek: number | null;
  focus: TrackingPillar[];

  isOnboarded: boolean;
};

/** Current age, derived rather than stored. */
export function currentAge(profile: Profile, now: Date = new Date()): number | null {
  if (profile.birthYear === null) return null;
  return now.getFullYear() - profile.birthYear;
}
