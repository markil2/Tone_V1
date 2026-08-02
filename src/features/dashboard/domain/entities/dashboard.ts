import type { MuscleId } from './muscles';

/**
 * Dashboard domain model.
 *
 * The split below is the important part: `DashboardMetrics` is everything a data
 * source can supply (today a mock, later HealthKit or a wearable), and is purely
 * serializable. `DashboardData` adds the two things that only exist while a
 * screen is on-screen — the generated summary text and the current selection.
 *
 * Keeping them apart means the cache, the storage layer and any future sync
 * never have to round-trip transient UI state.
 */

export const BODY_VIEWS = ['overview', 'muscles', 'recovery', 'sleep', 'ai'] as const;
export type BodyView = (typeof BODY_VIEWS)[number];

export const MUSCLE_STATUSES = ['recovered', 'balanced', 'fatigued'] as const;
export type MuscleStatus = (typeof MUSCLE_STATUSES)[number];

export type MuscleData = {
  id: MuscleId;
  name: string;
  /** 0–100. How much accumulated work this muscle is carrying. */
  trainingLoad: number;
  /** 0–100. How ready it is to work again. */
  recovery: number;
  status: MuscleStatus;
  /** Null when there is no training history for it yet. */
  lastTrainedDaysAgo: number | null;
  recommendation: string;
};

export type DashboardMetrics = {
  energyPotential: number;
  recovery: number;
  strain: number;
  sleepScore: number;
  sleepDurationMinutes: number;
  deepSleepMinutes: number;
  /** Signed delta, e.g. +12 means recovery rose 12 points overnight. */
  recoveryChange: number;
  /** The user's own sleep goal, from onboarding — not a population default. */
  sleepTargetMinutes: number;
  muscles: MuscleData[];
  /** Muscles worth calling out on the body map today. */
  highlightedMuscleIds: MuscleId[];
};

export type DashboardData = DashboardMetrics & {
  summary: string;
  selectedBodyView: BodyView;
  selectedMuscle: MuscleData | null;
};

/* -------------------------------------------------------------------------- */

/**
 * Qualitative band for a 0–100 score.
 *
 * Exists so no metric is ever communicated by colour alone: the word is rendered
 * next to every gauge and read out by screen readers. Deliberately descriptive
 * rather than evaluative — a "High" strain is not a failing grade.
 */
export function scoreBand(value: number): string {
  if (value >= 80) return 'High';
  if (value >= 65) return 'Good';
  if (value >= 45) return 'Moderate';
  if (value >= 25) return 'Low';
  return 'Very low';
}

export const MUSCLE_STATUS_LABELS: Record<MuscleStatus, string> = {
  recovered: 'Recovered',
  balanced: 'Balanced',
  fatigued: 'Fatigued',
};

/** Minutes → "7h 42m", the format used on every sleep surface. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function formatLastTrained(daysAgo: number | null): string {
  if (daysAgo === null) return 'Not logged yet';
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  return `${daysAgo} days ago`;
}

export function findMuscle(
  muscles: readonly MuscleData[],
  id: MuscleId | null,
): MuscleData | null {
  if (id === null) return null;
  return muscles.find((muscle) => muscle.id === id) ?? null;
}
