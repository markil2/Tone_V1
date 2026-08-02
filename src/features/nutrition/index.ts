/** Public API of the nutrition feature. */
export { NutritionScreen } from './presentation/screens/NutritionScreen';
export type { NutritionScreenProps } from './presentation/screens/NutritionScreen';
export { ProgressRing } from './presentation/components/ProgressRing';
export { useNutrition } from './presentation/hooks/useNutrition';

export {
  consumedTotals,
  cupsFromMl,
  isLogged,
  mealTotals,
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  MICRONUTRIENTS,
  ML_PER_BOTTLE,
  ML_PER_CUP,
} from './domain/entities/nutrition';
export type {
  DayPart,
  Food,
  MacroTargets,
  Meal,
  MealSlot,
  Micronutrient,
  MicronutrientId,
  NutritionData,
  Supplement,
  WaterData,
} from './domain/entities/nutrition';

export { generateGuidance } from './domain/use-cases/generate-guidance';
export type { Guidance } from './domain/use-cases/generate-guidance';
export { summarizeMeal } from './domain/use-cases/meal-summary';
export { progressRatio, progressStatus, PROGRESS_LABELS } from './domain/use-cases/progress-status';
export { buildMockDay } from './data/mock-nutrition.repository';
