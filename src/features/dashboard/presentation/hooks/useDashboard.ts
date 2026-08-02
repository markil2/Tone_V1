import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { container } from '@/bootstrap/container';
import { isErr, unwrap } from '@/core/result';
import { useSession } from '@/features/auth';
import { sleepTargetForTrainingDays } from '@/features/onboarding';
import { useDailyTargets, useProfile } from '@/features/profile';
import { haptics } from '@/shared/haptics';
import { localKeys, readJson } from '@/lib/local-store';
import {
  findMuscle,
  type BodyView,
  type DashboardData,
  type DashboardMetrics,
} from '../../domain/entities/dashboard';
import type { MuscleId } from '../../domain/entities/muscles';
import type { DashboardRepository } from '../../domain/ports/dashboard-repository';
import type { DashboardSeed } from '../../domain/use-cases/create-initial-dashboard';
import { generateDailySummary } from '../../domain/use-cases/generate-summary';
import { useDashboardView } from '../store/dashboard-view';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  byUser: (userId: string) => ['dashboard', userId] as const,
};

/** Everything the dashboard needs injected, so the dev preview can run offline. */
export type DashboardDependencies = {
  repository?: DashboardRepository;
  createInitial?: (seed: DashboardSeed) => DashboardMetrics;
  /** Overrides the session user. Only the preview route needs this. */
  userId?: string;
  /** Overrides the profile-derived seed. Only the preview route needs this. */
  seed?: DashboardSeed;
};

/**
 * A new account has no observations yet. Show a clean 100% baseline until the
 * first completed workout gives the dashboard something to react to.
 */
function fullBaseline(metrics: DashboardMetrics): DashboardMetrics {
  return {
    ...metrics,
    energyPotential: 100,
    recovery: 100,
    strain: 100,
    sleepScore: 100,
    recoveryChange: 0,
    highlightedMuscleIds: [],
    muscles: metrics.muscles.map((muscle) => ({
      ...muscle,
      trainingLoad: 100,
      recovery: 100,
      status: 'recovered',
      lastTrainedDaysAgo: null,
      recommendation: 'Ready — log your first workout',
    })),
  };
}

/**
 * View-model for the dashboard.
 *
 * Owns three things the screen should not: fetching the snapshot, seeding one on
 * first open, and composing the transient view state onto it. The screen renders
 * `data` and calls `actions`.
 *
 * Seeding happens inside the query function rather than in an effect. An effect
 * would fire after a render with no data, so the first paint would be an empty
 * dashboard that then pops full — and on a slow device that flash is visible.
 */
export function useDashboard(dependencies: DashboardDependencies = {}) {
  const {
    repository = container.dashboard.repository,
    createInitial = container.dashboard.createInitial,
  } = dependencies;

  const { userId: sessionUserId } = useSession();
  const userId = dependencies.userId ?? sessionUserId;

  const { data: profile } = useProfile();
  const { data: targets } = useDailyTargets();

  /**
   * Selected field by field rather than as one object.
   *
   * Subscribing to the whole store would re-render on every unrelated change and
   * hand the callbacks below a new dependency each time — which is exactly what
   * the React Compiler flags as unpreservable memoization. Zustand action
   * identities are stable, so these deps genuinely never change.
   */
  const bodyView = useDashboardView((state) => state.bodyView);
  const selectedMuscleId = useDashboardView((state) => state.selectedMuscleId);
  const panel = useDashboardView((state) => state.panel);
  const setBodyViewAction = useDashboardView((state) => state.setBodyView);
  const selectMuscleAction = useDashboardView((state) => state.selectMuscle);
  const clearMuscle = useDashboardView((state) => state.clearMuscle);
  const openPanel = useDashboardView((state) => state.openPanel);
  const closePanel = useDashboardView((state) => state.closePanel);

  /**
   * The seed is only read the very first time a user opens the dashboard, but it
   * has to be stable across renders or the query would re-run on every keystroke
   * elsewhere in the tree.
   */
  const seed = useMemo<DashboardSeed>(() => {
    if (dependencies.seed) return dependencies.seed;

    const trainingDays = profile?.trainingDaysPerWeek ?? null;

    return {
      primaryGoal: profile?.primaryGoal ?? null,
      trainingDaysPerWeek: trainingDays,
      // Prefer the stored target; fall back to recomputing it from the same rule
      // onboarding used, so the two can never disagree.
      sleepTargetMinutes:
        targets?.sleepMinutes ??
        (trainingDays === null ? null : sleepTargetForTrainingDays(trainingDays)),
    };
  }, [dependencies.seed, profile, targets]);

  const query = useQuery({
    queryKey: dashboardKeys.byUser(userId ?? 'anonymous'),
    enabled: userId !== null,
    queryFn: async (): Promise<DashboardMetrics> => {
      const milestone = await readJson<boolean>(localKeys.firstWorkoutCompleted(userId!));
      const hasCompletedWorkout = !isErr(milestone) && milestone.value === true;
      const existing = unwrap(await repository.getMetrics(userId!));
      if (existing) return hasCompletedWorkout ? existing : fullBaseline(existing);

      const seeded = createInitial(seed);

      // A failed write is not fatal — the user still gets a working dashboard,
      // it just gets regenerated next launch. Blocking on it would be worse.
      const saved = await repository.saveMetrics(userId!, seeded);
      if (isErr(saved)) return hasCompletedWorkout ? seeded : fullBaseline(seeded);

      return hasCompletedWorkout ? seeded : fullBaseline(seeded);
    },
  });

  const metrics = query.data ?? null;

  const data = useMemo<DashboardData | null>(() => {
    if (!metrics) return null;

    return {
      ...metrics,
      summary: generateDailySummary(metrics),
      selectedBodyView: bodyView,
      selectedMuscle: findMuscle(metrics.muscles, selectedMuscleId),
    };
  }, [metrics, bodyView, selectedMuscleId]);

  const selectMuscle = useCallback(
    (id: MuscleId) => {
      haptics.select();
      selectMuscleAction(id);
    },
    [selectMuscleAction],
  );

  const setBodyView = useCallback(
    (next: BodyView) => {
      haptics.tick();
      setBodyViewAction(next);
    },
    [setBodyViewAction],
  );

  return {
    data,
    metrics,
    isLoading: query.isPending && userId !== null,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isFetching && !query.isPending,
    refetch: query.refetch,

    panel,
    actions: { setBodyView, selectMuscle, clearMuscle, openPanel, closePanel },
  };
}
