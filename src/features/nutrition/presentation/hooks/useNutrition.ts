import { useCallback, useEffect, useMemo, useState } from 'react';

import { logger } from '@/core/logger';
import { isOk } from '@/core/result';
import { useSession } from '@/features/auth';
import { useDailyTargets } from '@/features/profile';
import { createMockNutritionRepository } from '../../data/mock-nutrition.repository';
import {
  consumedTotals,
  createId,
  ML_PER_BOTTLE,
  ML_PER_CUP,
  type Food,
  type Meal,
  type NutritionData,
  type Supplement,
} from '../../domain/entities/nutrition';
import type { NutritionRepository } from '../../domain/ports/nutrition-repository';

const repository: NutritionRepository = createMockNutritionRepository();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * View-model for the nutrition page.
 *
 * Holds the day in local state and writes through to storage on every change, so
 * every control on the page — a cup of water, a deleted food, a logged
 * supplement — updates the rings and the guidance immediately rather than after
 * a round-trip.
 *
 * Not TanStack Query: this is a single mutable document being edited in place,
 * not fetched-and-cached server state, and modelling it as a query would mean
 * invalidating the whole day on every tap.
 */
export function useNutrition() {
  const { userId } = useSession();
  const { data: targets } = useDailyTargets();

  const [day, setDay] = useState<NutritionData | null>(null);
  const [isLoading, setLoading] = useState(true);

  const date = todayKey();
  const owner = userId ?? 'preview';

  useEffect(() => {
    let active = true;

    void (async () => {
      const stored = await repository.getDay(owner, date);
      if (!active) return;

      const existing = isOk(stored) ? stored.value : null;
      setDay(existing ?? repository.seedDay(new Date()));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [owner, date]);

  /**
   * Apply a change and persist it.
   *
   * A failed write is logged, not surfaced: the user's edit is already reflected
   * on screen, and interrupting them with an error over a cache miss would be
   * worse than losing one day of local mock data.
   */
  const mutate = useCallback(
    (fn: (current: NutritionData) => NutritionData) => {
      setDay((current) => {
        if (!current) return current;
        const next = fn(current);

        void repository.saveDay(owner, next).then((result) => {
          if (!isOk(result)) logger.error('Failed to persist nutrition day', result.error);
        });

        return next;
      });
    },
    [owner],
  );

  /**
   * The user's real targets take precedence over the mock ones.
   *
   * Onboarding already computed these from their body metrics and goal — showing
   * a generic 2,700 kcal next to their own logged food would be wrong the moment
   * they finish the survey.
   */
  const resolved = useMemo<NutritionData | null>(() => {
    if (!day) return null;
    if (!targets) return day;

    return {
      ...day,
      targets: {
        calories: targets.calories,
        proteinG: targets.proteinG,
        carbsG: targets.carbsG,
        fatG: targets.fatG,
      },
      water: { ...day.water, goalMl: targets.waterMl },
    };
  }, [day, targets]);

  const consumed = useMemo(
    () => (resolved ? consumedTotals(resolved.meals) : null),
    [resolved],
  );

  /* -------------------------------- actions -------------------------------- */

  const addWater = useCallback(
    (ml: number) =>
      mutate((current) => ({
        ...current,
        water: {
          ...current.water,
          consumedMl: current.water.consumedMl + ml,
          history: [
            ...current.water.history,
            { id: createId('w'), ml, loggedAt: new Date().toISOString() },
          ],
        },
      })),
    [mutate],
  );

  const addCup = useCallback(() => addWater(ML_PER_CUP), [addWater]);
  const addBottle = useCallback(() => addWater(ML_PER_BOTTLE), [addWater]);

  const undoWater = useCallback(
    () =>
      mutate((current) => {
        const last = current.water.history.at(-1);
        if (!last) return current;

        return {
          ...current,
          water: {
            consumedMl: Math.max(0, current.water.consumedMl - last.ml),
            goalMl: current.water.goalMl,
            history: current.water.history.slice(0, -1),
          },
        };
      }),
    [mutate],
  );

  const updateMeal = useCallback(
    (mealId: string, fn: (meal: Meal) => Meal) =>
      mutate((current) => ({
        ...current,
        meals: current.meals.map((meal) => (meal.id === mealId ? fn(meal) : meal)),
      })),
    [mutate],
  );

  const addFood = useCallback(
    (mealId: string, food: Food) =>
      updateMeal(mealId, (meal) => ({
        ...meal,
        foods: [...meal.foods, food],
        // Adding the first food is what makes an empty slot a logged meal.
        loggedAt: meal.loggedAt ?? new Date().toISOString(),
      })),
    [updateMeal],
  );

  const removeFood = useCallback(
    (mealId: string, foodId: string) =>
      updateMeal(mealId, (meal) => ({
        ...meal,
        foods: meal.foods.filter((food) => food.id !== foodId),
      })),
    [updateMeal],
  );

  const clearMeal = useCallback(
    (mealId: string) => updateMeal(mealId, (meal) => ({ ...meal, foods: [], loggedAt: null })),
    [updateMeal],
  );

  const duplicateMeal = useCallback(
    (mealId: string) =>
      mutate((current) => {
        const source = current.meals.find((meal) => meal.id === mealId);
        if (!source) return current;

        // Snack is the catch-all destination — duplicating lunch into lunch
        // would silently double it with no way to tell the copies apart.
        return {
          ...current,
          meals: current.meals.map((meal) =>
            meal.slot === 'snack'
              ? {
                  ...meal,
                  name: `${source.name} (copy)`,
                  loggedAt: new Date().toISOString(),
                  foods: source.foods.map((food) => ({ ...food, id: createId('food') })),
                }
              : meal,
          ),
        };
      }),
    [mutate],
  );

  const renameMeal = useCallback(
    (mealId: string, name: string) => updateMeal(mealId, (meal) => ({ ...meal, name })),
    [updateMeal],
  );

  const addSupplement = useCallback(
    (supplement: Omit<Supplement, 'id'>) =>
      mutate((current) => ({
        ...current,
        supplements: [...current.supplements, { ...supplement, id: createId('sup') }],
      })),
    [mutate],
  );

  const toggleSupplement = useCallback(
    (supplementId: string) =>
      mutate((current) => ({
        ...current,
        supplements: current.supplements.map((supplement) =>
          supplement.id === supplementId
            ? {
                ...supplement,
                takenAt: supplement.takenAt === null ? new Date().toISOString() : null,
              }
            : supplement,
        ),
      })),
    [mutate],
  );

  const removeSupplement = useCallback(
    (supplementId: string) =>
      mutate((current) => ({
        ...current,
        supplements: current.supplements.filter((entry) => entry.id !== supplementId),
      })),
    [mutate],
  );

  return {
    day: resolved,
    consumed,
    isLoading,
    actions: {
      addCup,
      addBottle,
      undoWater,
      addFood,
      removeFood,
      clearMeal,
      duplicateMeal,
      renameMeal,
      addSupplement,
      toggleSupplement,
      removeSupplement,
    },
  };
}
