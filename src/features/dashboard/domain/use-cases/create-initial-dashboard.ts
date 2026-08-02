import type { PrimaryGoal } from '@/features/onboarding';
import type { DashboardMetrics } from '../entities/dashboard';
import type { MuscleId } from '../entities/muscles';

/**
 * Turns survey answers into the user's first dashboard snapshot.
 *
 * Runs once, immediately after onboarding, so the dashboard is never empty on
 * first open.
 *
 * Be precise about what is and is not personalised here. The four headline
 * scores cannot be derived from a survey — they need measured sleep, heart rate
 * and workout data that no source is connected to yet, so they come from the
 * baseline unchanged and are mocked. What *is* real: the sleep goal, which
 * onboarding already computed from training volume, and which muscles get
 * highlighted, which follows from the stated goal and weekly training days.
 *
 * When a real data source lands, this function keeps its job — seeding day one
 * before any samples have synced.
 */

export type DashboardSeed = {
  primaryGoal: PrimaryGoal | null;
  trainingDaysPerWeek: number | null;
  /** From `computeDailyTargets`, so the dashboard and onboarding agree. */
  sleepTargetMinutes: number | null;
};

/**
 * Extra muscles worth surfacing for each goal.
 *
 * Not a training program — just which groups the user is most likely to want to
 * see on day one given what they said they are working towards.
 */
const GOAL_EMPHASIS: Record<PrimaryGoal, MuscleId[]> = {
  build_muscle: ['biceps', 'triceps'],
  lose_weight: ['abdominals'],
  improve_performance: ['hamstrings', 'calves'],
  maintain_fitness: [],
};

/** Training this often means posterior-chain load is worth watching. */
const HIGH_VOLUME_DAYS = 5;

export function createInitialDashboard(
  baseline: DashboardMetrics,
  seed: DashboardSeed,
): DashboardMetrics {
  const highlighted = new Set<MuscleId>(baseline.highlightedMuscleIds);

  if (seed.primaryGoal !== null) {
    for (const id of GOAL_EMPHASIS[seed.primaryGoal]) highlighted.add(id);
  }

  if (seed.trainingDaysPerWeek !== null && seed.trainingDaysPerWeek >= HIGH_VOLUME_DAYS) {
    highlighted.add('hamstrings');
  }

  return {
    ...baseline,
    sleepTargetMinutes: seed.sleepTargetMinutes ?? baseline.sleepTargetMinutes,
    highlightedMuscleIds: [...highlighted],
  };
}
