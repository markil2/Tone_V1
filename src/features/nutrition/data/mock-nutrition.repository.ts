import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import {
  createId,
  ML_PER_CUP,
  type Food,
  type Meal,
  type Micronutrient,
  type NutritionData,
  type Supplement,
} from '../domain/entities/nutrition';
import type { NutritionRepository } from '../domain/ports/nutrition-repository';

/**
 * ============================================================================
 * THE NUTRITION MOCK DATA FILE. Every food, gram and millilitre the page shows
 * originates here.
 * ============================================================================
 *
 * Nothing is measured. There is no food database, barcode service or nutrition
 * API wired up, so the day below is hand-built to match the design reference:
 * 2,345 of 2,700 kcal, 162/180 g protein, 280/320 g carbs, 78/90 g fat, 5 of 8
 * cups of water.
 *
 * Totals are never stored — they are summed from the foods, so editing one item
 * moves every ring, summary and recommendation on the page. That is what makes
 * the mock behave like real data rather than a static picture.
 *
 * Replacing this means writing another `NutritionRepository`; no screen changes.
 */

function food(
  name: string,
  serving: string,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG = 0,
  isPlantWhole = false,
): Food {
  return {
    id: createId('food'),
    name,
    serving,
    quantity: 1,
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    isPlantWhole,
  };
}

/** Today at a given hour, so timestamps stay plausible whenever the app is opened. */
function todayAt(hour: number, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

/**
 * The day's foods.
 *
 * Portions are solved so the summed totals land exactly on the design's figures
 * — 2,345 kcal, 162 g protein, 280 g carbs, 78 g fat. Note that those four are
 * not self-consistent under Atwater factors (162×4 + 280×4 + 78×9 = 2,470), so
 * the per-item calorie values sit slightly below what the macros alone imply.
 * That is how real food labels behave once fibre is discounted and everything is
 * rounded, and it is the only way to hit all four targets at once.
 *
 * Dinner deliberately carries no whole plant food and under 6 g of fibre — that
 * is what makes the summary engine say "Add a fruit or vegetable" rather than
 * the string being hardcoded anywhere.
 */
function buildMeals(): Meal[] {
  return [
    {
      id: createId('meal'),
      slot: 'breakfast',
      name: 'Oats, berries and yoghurt',
      loggedAt: todayAt(8, 10),
      foods: [
        food('Rolled oats', '70 g', 245, 9, 42, 5, 7, false),
        food('Greek yoghurt', '250 g', 153, 24, 10, 1, 0, false),
        food('Blueberries', '100 g', 52, 1, 14, 0, 2.4, true),
        food('Banana', '1 medium', 97, 1, 27, 0, 3.1, true),
        food('Almond butter', '15 g', 86, 3, 3, 8, 1.5, true),
      ],
    },
    {
      id: createId('meal'),
      slot: 'lunch',
      name: 'Chicken and grain bowl',
      loggedAt: todayAt(13, 0),
      foods: [
        food('Chicken breast', '200 g', 221, 46, 0, 5, 0, false),
        food('Brown rice', '220 g cooked', 223, 5, 51, 2, 3, false),
        food('Mixed greens', '80 g', 20, 2, 3, 0, 2, true),
        food('Cherry tomatoes', '100 g', 17, 1, 4, 0, 1.2, true),
        food('Olive oil', 'half tbsp', 55, 0, 0, 7, 0, false),
        food('Feta', '40 g', 97, 8, 2, 9, 0, false),
      ],
    },
    {
      id: createId('meal'),
      slot: 'dinner',
      name: 'Salmon and potatoes',
      loggedAt: todayAt(19, 30),
      foods: [
        food('Salmon fillet', '200 g', 379, 46, 0, 22, 0, false),
        food('Roast potatoes', '320 g', 383, 8, 74, 9, 3, false),
        food('Butter', '12 g', 78, 0, 0, 9, 0, false),
        food('Sourdough bread', '100 g', 239, 8, 50, 1, 1.8, false),
      ],
    },
    {
      id: createId('meal'),
      slot: 'snack',
      name: 'Snack',
      loggedAt: null,
      foods: [],
    },
  ];
}

function buildMicronutrients(): Micronutrient[] {
  return [
    {
      id: 'iron',
      name: 'Iron',
      consumed: 14,
      goal: 18,
      unit: 'mg',
      sources: ['red meat', 'lentils', 'spinach', 'fortified cereal'],
      why: 'Carries oxygen in the blood. Low iron shows up as fatigue long before anything else.',
    },
    {
      id: 'calcium',
      name: 'Calcium',
      consumed: 900,
      goal: 1000,
      unit: 'mg',
      sources: ['yoghurt', 'cheese', 'tofu', 'fortified plant milk'],
      why: 'Bone density and muscle contraction. Training loads raise the requirement.',
    },
    {
      id: 'vitamin_d',
      name: 'Vitamin D',
      consumed: 6,
      goal: 20,
      unit: 'µg',
      sources: ['oily fish', 'egg yolk', 'sunlight', 'fortified milk'],
      why: 'Helps you absorb calcium. Hard to get from food alone in winter.',
    },
    {
      id: 'fiber',
      name: 'Fiber',
      consumed: 27,
      goal: 30,
      unit: 'g',
      sources: ['oats', 'beans', 'berries', 'whole grains'],
      why: 'Digestion and steady energy across the day.',
    },
  ];
}

function buildSupplements(): Supplement[] {
  return [
    { id: createId('sup'), name: 'Vitamin D3', dose: '1000 IU', takenAt: null, notes: null },
    { id: createId('sup'), name: 'Creatine monohydrate', dose: '5 g', takenAt: null, notes: null },
  ];
}

/** Targets match the reference. Overridden by the user's real targets when present. */
export const MOCK_TARGETS = {
  calories: 2700,
  proteinG: 180,
  carbsG: 320,
  fatG: 90,
} as const;

export function buildMockDay(date = new Date()): NutritionData {
  return {
    date: date.toISOString().slice(0, 10),
    targets: { ...MOCK_TARGETS },
    meals: buildMeals(),
    micronutrients: buildMicronutrients(),
    supplements: buildSupplements(),
    water: {
      // Five cups, as in the reference — logged across the morning and afternoon.
      consumedMl: 5 * ML_PER_CUP,
      goalMl: 8 * ML_PER_CUP,
      history: [
        { id: createId('w'), ml: ML_PER_CUP, loggedAt: todayAt(7, 30) },
        { id: createId('w'), ml: ML_PER_CUP, loggedAt: todayAt(9, 15) },
        { id: createId('w'), ml: ML_PER_CUP, loggedAt: todayAt(11, 45) },
        { id: createId('w'), ml: ML_PER_CUP, loggedAt: todayAt(14, 20) },
        { id: createId('w'), ml: ML_PER_CUP, loggedAt: todayAt(16, 5) },
      ],
    },
  };
}

const storageKey = (userId: string, date: string) => `pulse.nutrition.${userId}.${date}`;

export function createMockNutritionRepository(): NutritionRepository {
  return {
    async getDay(userId: string, date: string): Promise<Result<NutritionData | null, AppError>> {
      try {
        const raw = await AsyncStorage.getItem(storageKey(userId, date));
        if (raw === null) return ok(null);

        try {
          return ok(JSON.parse(raw) as NutritionData);
        } catch (cause) {
          // A corrupt record regenerates rather than trapping the user.
          logger.error('Discarding unreadable nutrition day', { cause });
          await AsyncStorage.removeItem(storageKey(userId, date));
          return ok(null);
        }
      } catch (cause) {
        return err(
          new AppError({
            code: 'unknown',
            message: 'Failed to read nutrition day',
            userMessage: "We couldn't load today's nutrition.",
            cause,
          }),
        );
      }
    },

    async saveDay(userId: string, data: NutritionData): Promise<Result<void, AppError>> {
      try {
        await AsyncStorage.setItem(storageKey(userId, data.date), JSON.stringify(data));
        return ok(undefined);
      } catch (cause) {
        return err(
          new AppError({
            code: 'unknown',
            message: 'Failed to save nutrition day',
            userMessage: "We couldn't save your changes.",
            cause,
          }),
        );
      }
    },

    seedDay: (date) => buildMockDay(date),
  };
}
