import type { Workout, WorkoutSet } from '../entities/workout';

/**
 * Personal records.
 *
 * Two are tracked per exercise, because lifters care about both and they move
 * independently: the heaviest single set, and the best estimated one-rep max.
 * A 5×100kg is a bigger performance than a 1×105kg on the second measure and a
 * smaller one on the first — showing only one hides real progress.
 *
 * Estimated 1RM uses Epley. It is unreliable above roughly 12 reps, so records
 * are not claimed from high-rep sets at all rather than being quietly wrong.
 */

export const MAX_REPS_FOR_ESTIMATE = 12;

export type PersonalRecord = {
  exerciseId: string;
  bestWeightKg: number;
  bestEstimatedOneRepMaxKg: number;
  /** ISO date of the workout that set it. */
  achievedAt: string;
};

/** Epley: 1RM ≈ w × (1 + reps/30). Returns the weight itself for a single. */
export function estimateOneRepMax(weightKg: number, reps: number): number | null {
  if (reps < 1 || reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

function isRecordEligible(set: WorkoutSet): boolean {
  return set.isCompleted && set.kind === 'working' && set.weightKg !== null && set.reps !== null;
}

/** The records a single workout establishes, before comparing against history. */
export function recordsFromWorkout(workout: Workout): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>();
  const achievedAt = workout.endedAt ?? workout.startedAt;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (!isRecordEligible(set)) continue;

      const oneRepMax = estimateOneRepMax(set.weightKg!, set.reps!);
      const existing = records.get(exercise.exerciseId);

      records.set(exercise.exerciseId, {
        exerciseId: exercise.exerciseId,
        bestWeightKg: Math.max(existing?.bestWeightKg ?? 0, set.weightKg!),
        bestEstimatedOneRepMaxKg: Math.max(
          existing?.bestEstimatedOneRepMaxKg ?? 0,
          oneRepMax ?? 0,
        ),
        achievedAt,
      });
    }
  }

  return records;
}

export type BrokenRecord = {
  exerciseId: string;
  kind: 'weight' | 'one_rep_max';
  previousKg: number;
  newKg: number;
};

/**
 * Which records this workout beat.
 *
 * An exercise with no history does not count as a record — the first time you
 * do something is not a personal best, and celebrating it cheapens the ones that
 * are.
 */
export function findBrokenRecords(
  workout: Workout,
  history: Map<string, PersonalRecord>,
): BrokenRecord[] {
  const broken: BrokenRecord[] = [];

  for (const [exerciseId, candidate] of recordsFromWorkout(workout)) {
    const previous = history.get(exerciseId);
    if (!previous) continue;

    if (candidate.bestWeightKg > previous.bestWeightKg) {
      broken.push({
        exerciseId,
        kind: 'weight',
        previousKg: previous.bestWeightKg,
        newKg: candidate.bestWeightKg,
      });
    }

    if (candidate.bestEstimatedOneRepMaxKg > previous.bestEstimatedOneRepMaxKg) {
      broken.push({
        exerciseId,
        kind: 'one_rep_max',
        previousKg: previous.bestEstimatedOneRepMaxKg,
        newKg: candidate.bestEstimatedOneRepMaxKg,
      });
    }
  }

  return broken;
}

/** Fold a finished workout's records into the running history. */
export function mergeRecords(
  history: Map<string, PersonalRecord>,
  workout: Workout,
): Map<string, PersonalRecord> {
  const merged = new Map(history);

  for (const [exerciseId, candidate] of recordsFromWorkout(workout)) {
    const previous = merged.get(exerciseId);

    merged.set(exerciseId, {
      exerciseId,
      bestWeightKg: Math.max(previous?.bestWeightKg ?? 0, candidate.bestWeightKg),
      bestEstimatedOneRepMaxKg: Math.max(
        previous?.bestEstimatedOneRepMaxKg ?? 0,
        candidate.bestEstimatedOneRepMaxKg,
      ),
      achievedAt:
        candidate.bestWeightKg > (previous?.bestWeightKg ?? 0)
          ? candidate.achievedAt
          : (previous?.achievedAt ?? candidate.achievedAt),
    });
  }

  return merged;
}
