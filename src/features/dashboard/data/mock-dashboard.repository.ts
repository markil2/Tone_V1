import type { AppError } from '@/core/errors';
import { ok, type Result } from '@/core/result';
import type {
  DashboardMetrics,
  MuscleData,
} from '../domain/entities/dashboard';
import { MUSCLE_LABELS, type MuscleId } from '../domain/entities/muscles';
import type { DashboardRepository } from '../domain/ports/dashboard-repository';
import {
  muscleRecommendation,
  muscleStatusFromRecovery,
} from '../domain/use-cases/muscle-status';
import { readJson, storageKeys, writeJson } from './dashboard-storage';

/**
 * ============================================================================
 * THE MOCK DATA FILE. Everything the dashboard shows as a health figure
 * originates here, and nowhere else.
 * ============================================================================
 *
 * None of these numbers are measured. There is no HealthKit, Health Connect,
 * wearable or backend connected yet (Milestone 8), so the values below are the
 * design reference's, hard-coded. They are stable per user rather than random:
 * a dashboard whose numbers change on every reload is impossible to develop or
 * demo against.
 *
 * Replacing this with real data means writing another `DashboardRepository`
 * implementation and swapping one line in `src/bootstrap/container.ts`. No
 * screen, hook or component needs to change — that is what the port is for.
 */

/** Raw per-muscle figures. Status and recommendation are derived, never typed in. */
const MUSCLE_SEED: Record<MuscleId, { trainingLoad: number; recovery: number; lastTrainedDaysAgo: number | null }> = {
  deltoid: { trainingLoad: 62, recovery: 74, lastTrainedDaysAgo: 2 },
  pectoral: { trainingLoad: 58, recovery: 71, lastTrainedDaysAgo: 2 },
  biceps: { trainingLoad: 44, recovery: 82, lastTrainedDaysAgo: 4 },
  triceps: { trainingLoad: 47, recovery: 79, lastTrainedDaysAgo: 4 },
  abdominals: { trainingLoad: 39, recovery: 86, lastTrainedDaysAgo: 1 },
  quadriceps: { trainingLoad: 55, recovery: 68, lastTrainedDaysAgo: 3 },
  hamstrings: { trainingLoad: 71, recovery: 48, lastTrainedDaysAgo: 1 },
  calves: { trainingLoad: 33, recovery: 88, lastTrainedDaysAgo: 5 },
};

function buildMuscles(): MuscleData[] {
  return (Object.keys(MUSCLE_SEED) as MuscleId[]).map((id) => {
    const seed = MUSCLE_SEED[id];
    const status = muscleStatusFromRecovery(seed.recovery);

    return {
      id,
      name: MUSCLE_LABELS[id],
      trainingLoad: seed.trainingLoad,
      recovery: seed.recovery,
      status,
      lastTrainedDaysAgo: seed.lastTrainedDaysAgo,
      recommendation: muscleRecommendation(status, seed.trainingLoad),
    };
  });
}

/**
 * The baseline snapshot, matching the design reference exactly.
 *
 * `sleepTargetMinutes` is the one value here that gets overwritten with a real
 * one — `createInitialDashboard` replaces it with the target onboarding computed
 * from the user's own training volume.
 */
export const BASELINE_METRICS: DashboardMetrics = {
  energyPotential: 82,
  recovery: 74,
  strain: 58,
  sleepScore: 78,
  sleepDurationMinutes: 7 * 60 + 42,
  deepSleepMinutes: 60 + 36,
  recoveryChange: 12,
  sleepTargetMinutes: 8 * 60,
  muscles: buildMuscles(),
  highlightedMuscleIds: ['deltoid', 'pectoral', 'quadriceps'],
};

/** A fresh copy each call — callers must never mutate the shared baseline. */
export function baselineMetrics(): DashboardMetrics {
  return { ...BASELINE_METRICS, muscles: buildMuscles() };
}

export function createMockDashboardRepository(): DashboardRepository {
  return {
    async getMetrics(userId: string): Promise<Result<DashboardMetrics | null, AppError>> {
      return readJson<DashboardMetrics>(storageKeys.metrics(userId));
    },

    async saveMetrics(
      userId: string,
      metrics: DashboardMetrics,
    ): Promise<Result<void, AppError>> {
      return writeJson(storageKeys.metrics(userId), metrics);
    },
  };
}

/**
 * In-memory variant for the dev preview route, which has no signed-in user and
 * must not write anything to the device.
 */
export function createInMemoryDashboardRepository(): DashboardRepository {
  let stored: DashboardMetrics | null = null;

  return {
    async getMetrics() {
      return ok(stored);
    },
    async saveMetrics(_userId: string, metrics: DashboardMetrics) {
      stored = metrics;
      return ok(undefined);
    },
  };
}
