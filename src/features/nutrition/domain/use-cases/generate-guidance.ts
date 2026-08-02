import {
  consumedTotals,
  cupsFromMl,
  isLogged,
  MEAL_SLOT_LABELS,
  type NutritionData,
} from '../entities/nutrition';
import { progressRatio } from './progress-status';

/**
 * The nutrition recommendation engine.
 *
 * Rules over the day's own numbers plus the dashboard's recovery and strain —
 * not a fixed list of tips, so the card changes as the day does. Each rule
 * carries a priority and only the top few surface, because advice nobody can act
 * on is noise.
 *
 * Scope is general wellness. Nothing here diagnoses, prescribes, or tells anyone
 * to restrict intake — deliberately, since a nutrition app is exactly where that
 * would do harm.
 */

export type Guidance = {
  id: string;
  message: string;
  /** Higher surfaces first. */
  priority: number;
};

export type GuidanceInputs = {
  nutrition: NutritionData;
  /** From the dashboard. Null before its metrics have loaded. */
  recovery: number | null;
  strain: number | null;
};

const MAX_SHOWN = 3;

export function generateGuidance({ nutrition, recovery, strain }: GuidanceInputs): Guidance[] {
  const consumed = consumedTotals(nutrition.meals);
  const { targets, water } = nutrition;
  const candidates: Guidance[] = [];

  /* ------------------------------- hydration ------------------------------- */
  const waterRatio = progressRatio(water.consumedMl, water.goalMl);
  if (waterRatio < 0.5) {
    const remaining = Math.max(0, cupsFromMl(water.goalMl - water.consumedMl));
    candidates.push({
      id: 'hydration',
      message:
        strain !== null && strain >= 60
          ? `Strain is at ${strain}% today — about ${Math.round(remaining)} more cups would keep hydration ahead of it.`
          : `You're about ${Math.round(remaining)} cups short of your water goal.`,
      priority: strain !== null && strain >= 60 ? 90 : 60,
    });
  }

  /* -------------------------------- protein -------------------------------- */
  const proteinRatio = progressRatio(consumed.proteinG, targets.proteinG);
  if (proteinRatio < 0.7) {
    const shortfall = Math.max(0, Math.round(targets.proteinG - consumed.proteinG));
    candidates.push({
      id: 'protein',
      message:
        recovery !== null && recovery < 70
          ? `Recovery is at ${recovery}% and you're ${shortfall}g short on protein — worth closing that gap today.`
          : `About ${shortfall}g of protein left to hit your target.`,
      priority: recovery !== null && recovery < 70 ? 95 : 70,
    });
  }

  /* -------------------------------- calories ------------------------------- */
  const calorieRatio = progressRatio(consumed.calories, targets.calories);
  if (calorieRatio >= 0.98) {
    candidates.push({
      id: 'calories-met',
      message: 'You have met your calorie target for today.',
      priority: 30,
    });
  }

  /* ---------------------------- micronutrients ----------------------------- */
  for (const micro of nutrition.micronutrients) {
    if (progressRatio(micro.consumed, micro.goal) < 0.6) {
      candidates.push({
        id: `micro-${micro.id}`,
        message: `${micro.name} is running low — ${micro.sources.slice(0, 2).join(' and ')} are easy sources.`,
        priority: 55,
      });
    }
  }

  /* ------------------------------ unlogged meals --------------------------- */
  const unlogged = nutrition.meals.filter((meal) => !isLogged(meal));
  if (unlogged.length > 0 && unlogged[0]) {
    candidates.push({
      id: 'unlogged',
      message: `${MEAL_SLOT_LABELS[unlogged[0].slot]} isn't logged yet, so today's totals are incomplete.`,
      priority: 40,
    });
  }

  /* ------------------------------ supplements ------------------------------ */
  const untaken = nutrition.supplements.filter((supplement) => supplement.takenAt === null);
  if (untaken.length > 0) {
    candidates.push({
      id: 'supplements',
      message: `${untaken.length} supplement${untaken.length === 1 ? '' : 's'} not logged today.`,
      priority: 25,
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      id: 'all-good',
      message: 'Your intake, hydration and micronutrients are all tracking well today.',
      priority: 10,
    });
  }

  return candidates.sort((a, b) => b.priority - a.priority).slice(0, MAX_SHOWN);
}
