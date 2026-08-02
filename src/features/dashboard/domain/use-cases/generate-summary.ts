import { MUSCLE_LABELS } from '../entities/muscles';
import type { DashboardMetrics } from '../entities/dashboard';

/**
 * Today's summary, composed from the current numbers.
 *
 * Pure and deterministic: change any metric and the sentence changes with it, so
 * the card can never sit there describing yesterday. Template-based rather than
 * model-generated on purpose — this line renders before any network call, and a
 * summary that contradicts the gauges directly above it is worse than no summary.
 *
 * Wellness framing only. Nothing here diagnoses, and nothing scolds.
 */

/** Below this the sentence would nag about noise rather than a real shortfall. */
const MEANINGFUL_SLEEP_DEFICIT_MINUTES = 45;

/** One tired muscle is normal training. Two or more is worth naming. */
const NOTABLE_FATIGUE_COUNT = 2;

function recoveryClause(recovery: number): string {
  if (recovery >= 80) return 'Your recovery is strong';
  if (recovery >= 65) return 'Your recovery is on track';
  if (recovery >= 45) return 'Your recovery is partway back';
  return 'Your recovery is still catching up';
}

function energyClause(energy: number): string {
  if (energy >= 80) return 'your energy is high';
  if (energy >= 65) return 'your energy is steady';
  if (energy >= 45) return 'your energy is moderate';
  return 'your energy is low';
}

function actionClause(metrics: DashboardMetrics): string {
  const fatigued = metrics.muscles.filter((muscle) => muscle.status === 'fatigued');

  if (fatigued.length >= NOTABLE_FATIGUE_COUNT) {
    const names = fatigued
      .slice(0, 2)
      .map((muscle) => MUSCLE_LABELS[muscle.id].toLowerCase())
      .join(' and ');
    return `Your ${names} are carrying the most load, so keep today light and prioritise mobility.`;
  }

  if (metrics.strain >= 70) {
    return 'Strain is running high, so an easy day now will pay off in your next hard session.';
  }

  if (metrics.strain >= 45) {
    return 'Focus on maintaining mobility and staying consistent with your training and nutrition.';
  }

  return 'There is room to add intensity today if you feel good going into it.';
}

function sleepClause(metrics: DashboardMetrics): string | null {
  const deficit = metrics.sleepTargetMinutes - metrics.sleepDurationMinutes;
  if (deficit < MEANINGFUL_SLEEP_DEFICIT_MINUTES) return null;

  const hours = (deficit / 60).toFixed(1).replace(/\.0$/, '');
  return `You are about ${hours}h short of your sleep goal, which usually shows up as lower recovery tomorrow.`;
}

export function generateDailySummary(metrics: DashboardMetrics): string {
  const opening = `${recoveryClause(metrics.recovery)} and ${energyClause(
    metrics.energyPotential,
  )}.`;

  return [opening, sleepClause(metrics), actionClause(metrics)]
    .filter((clause): clause is string => clause !== null)
    .join(' ');
}
