/**
 * How a value is doing against its goal.
 *
 * One function so the calorie ring, the three macro rings and the four
 * micronutrient rings can never label the same ratio differently — and so the
 * words are available to screen readers, since a ring alone communicates by
 * colour and shape only.
 */

export const PROGRESS_STATUSES = ['low', 'on_track', 'complete', 'over'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const PROGRESS_LABELS: Record<ProgressStatus, string> = {
  low: 'Add variety',
  on_track: 'On track',
  complete: 'Goal met',
  over: 'Over goal',
};

/** Macro wording differs from micro wording — "Add variety" makes no sense for fat. */
export const MACRO_PROGRESS_LABELS: Record<ProgressStatus, string> = {
  low: 'Behind',
  on_track: 'On track',
  complete: 'Goal met',
  over: 'Over goal',
};

/**
 * Thresholds.
 *
 * `on_track` starts at 60% because these are read part-way through a day: being
 * at 40% of your protein goal at lunchtime is normal, not a failure, and an app
 * that says otherwise trains people to ignore it.
 */
export const ON_TRACK_AT = 0.6;
export const COMPLETE_AT = 0.98;
export const OVER_AT = 1.1;

export function progressStatus(consumed: number, goal: number): ProgressStatus {
  if (goal <= 0) return 'low';
  const ratio = consumed / goal;

  if (ratio >= OVER_AT) return 'over';
  if (ratio >= COMPLETE_AT) return 'complete';
  if (ratio >= ON_TRACK_AT) return 'on_track';
  return 'low';
}

/** 0–1, clamped. Rings must never overdraw when someone exceeds a goal. */
export function progressRatio(consumed: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(1, consumed / goal));
}
