import { isLogged, mealTotals, type Meal } from '../entities/nutrition';

/**
 * The one-line verdict on a meal.
 *
 * Derived from the meal's own macros rather than written per meal, so editing a
 * food changes the summary — the alternative is a label that keeps saying
 * "Balanced" after you delete the vegetables.
 *
 * Wording is descriptive, never judgemental: it names what is missing and why it
 * helps, and it never implies a meal was a mistake.
 */

export type MealSummary = {
  headline: string;
  detail: string;
  /** True when the meal reads well as-is; drives the accent colour. */
  isPositive: boolean;
};

/** Below this share of calories from protein, a meal reads as light on protein. */
const LOW_PROTEIN_SHARE = 0.15;
const CALORIES_PER_G_PROTEIN = 4;
/** Roughly a third of a day's fibre, the point at which a meal contributes real fibre. */
const DECENT_FIBER_G = 6;

export function summarizeMeal(meal: Meal): MealSummary {
  if (!isLogged(meal)) {
    return {
      headline: 'Not logged',
      detail: 'Add this meal to keep your totals accurate.',
      isPositive: false,
    };
  }

  const totals = mealTotals(meal);
  const fiber = meal.foods.reduce((sum, food) => sum + food.fiberG * food.quantity, 0);
  const hasProduce = meal.foods.some((food) => food.isPlantWhole);

  const proteinShare =
    totals.calories > 0
      ? (totals.proteinG * CALORIES_PER_G_PROTEIN) / totals.calories
      : 0;

  if (!hasProduce && fiber < DECENT_FIBER_G) {
    return {
      headline: 'Add a fruit or vegetable',
      detail: 'Boost your fiber and micronutrients.',
      isPositive: false,
    };
  }

  if (proteinShare < LOW_PROTEIN_SHARE) {
    return {
      headline: 'Light on protein',
      detail: 'A protein source here would even out the day.',
      isPositive: false,
    };
  }

  return {
    headline: 'Balanced',
    detail: hasProduce
      ? 'Good mix of carbs, protein and produce.'
      : 'Good balance of macros.',
    isPositive: true,
  };
}
