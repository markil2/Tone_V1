/**
 * Nutrition domain model.
 *
 * Energy is kilocalories and every macro and micro is grams or milligrams —
 * the same SI-at-rest rule the rest of the app follows, so a unit preference
 * never rewrites stored data.
 *
 * Timestamps are ISO strings because these objects round-trip through JSON on
 * their way to storage; a `Date` would silently come back as a string.
 */

/* ---------------------------------- foods ---------------------------------- */

export type Food = {
  id: string;
  name: string;
  /** What one serving is, in words — "1 cup", "120 g", "2 slices". */
  serving: string;
  quantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Drives the "add a vegetable" style meal summaries, so it is not optional. */
  fiberG: number;
  /** Marks produce, so a meal can be told it is missing any. */
  isPlantWhole: boolean;
};

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export type Meal = {
  id: string;
  slot: MealSlot;
  name: string;
  foods: Food[];
  /** Null until the meal is logged — an unlogged slot still renders a card. */
  loggedAt: string | null;
};

/* ---------------------------------- water ---------------------------------- */

/** One cup is 250 ml; a bottle is 500 ml. Both are stored as millilitres. */
export const ML_PER_CUP = 250;
export const ML_PER_BOTTLE = 500;

export type WaterEntry = {
  id: string;
  ml: number;
  loggedAt: string;
};

export type WaterData = {
  consumedMl: number;
  goalMl: number;
  history: WaterEntry[];
};

export type DayPart = 'morning' | 'afternoon' | 'evening';

export const DAY_PART_LABELS: Record<DayPart, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

/* ----------------------------- micronutrients ------------------------------ */

export const MICRONUTRIENTS = ['iron', 'calcium', 'vitamin_d', 'fiber'] as const;
export type MicronutrientId = (typeof MICRONUTRIENTS)[number];

export type Micronutrient = {
  id: MicronutrientId;
  name: string;
  consumed: number;
  goal: number;
  unit: string;
  /** Foods that are dense in it — shown in the detail panel. */
  sources: string[];
  why: string;
};

/* ------------------------------- supplements ------------------------------- */

export type Supplement = {
  id: string;
  name: string;
  dose: string;
  /** Null until it is actually taken today. */
  takenAt: string | null;
  notes: string | null;
};

/* --------------------------------- the day --------------------------------- */

export type MacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type NutritionData = {
  date: string;
  targets: MacroTargets;
  meals: Meal[];
  water: WaterData;
  micronutrients: Micronutrient[];
  supplements: Supplement[];
};

/* -------------------------------- derivation ------------------------------- */

/**
 * Consumed totals, summed from foods rather than stored.
 *
 * Storing a total alongside the items that produce it guarantees they diverge
 * the first time a food is edited. This is cheap and can never be stale.
 */
export function consumedTotals(meals: readonly Meal[]): MacroTargets {
  return meals.reduce<MacroTargets>(
    (totals, meal) => {
      for (const food of meal.foods) {
        totals.calories += food.calories * food.quantity;
        totals.proteinG += food.proteinG * food.quantity;
        totals.carbsG += food.carbsG * food.quantity;
        totals.fatG += food.fatG * food.quantity;
      }
      return totals;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function mealTotals(meal: Meal): MacroTargets {
  return consumedTotals([meal]);
}

export function isLogged(meal: Meal): boolean {
  return meal.loggedAt !== null && meal.foods.length > 0;
}

export function cupsFromMl(ml: number): number {
  return Math.round((ml / ML_PER_CUP) * 10) / 10;
}

/** Which part of the day a timestamp falls in — drives the hydration timeline. */
export function dayPartOf(isoTimestamp: string): DayPart {
  const hour = new Date(isoTimestamp).getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
