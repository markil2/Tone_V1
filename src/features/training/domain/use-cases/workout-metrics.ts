import type { Exercise } from '../entities/exercise';
import type { Workout, WorkoutSet } from '../entities/workout';

/**
 * Everything the session header counts.
 *
 * Pure functions over a `Workout`, so the live session and a history row are
 * measured by exactly the same code — a number that changes meaning between
 * "during" and "after" is worse than no number.
 */

export type WorkoutMetrics = {
  /** Sum of weight × reps over completed working sets, in kilograms. */
  totalVolumeKg: number;
  completedSets: number;
  totalSets: number;
  durationSeconds: number;
  estimatedCalories: number;
};

/** Warm-ups and incomplete sets never count toward volume. */
function countsTowardVolume(set: WorkoutSet): boolean {
  return set.isCompleted && set.kind === 'working' && set.weightKg !== null && set.reps !== null;
}

export function totalVolumeKg(workout: Workout): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (sum, set) => (countsTowardVolume(set) ? sum + set.weightKg! * set.reps! : sum),
        0,
      ),
    0,
  );
}

export function countSets(workout: Workout): { completed: number; total: number } {
  return workout.exercises.reduce(
    (counts, exercise) => ({
      completed: counts.completed + exercise.sets.filter((set) => set.isCompleted).length,
      total: counts.total + exercise.sets.length,
    }),
    { completed: 0, total: 0 },
  );
}

export function durationSeconds(workout: Workout, now: Date = new Date()): number {
  const start = new Date(workout.startedAt).getTime();
  const end = workout.endedAt ? new Date(workout.endedAt).getTime() : now.getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}

/**
 * Calories burned, by the standard MET formula: kcal/min = MET × 3.5 × kg / 200.
 *
 * An estimate and labelled as one everywhere it appears. It uses the average MET
 * of the exercises actually performed and counts only elapsed session time, so
 * it is systematically conservative compared with trackers that assume constant
 * effort. Without a bodyweight it returns 0 rather than guessing one — an
 * invented mass would silently skew every number downstream.
 */
export function estimatedCalories(params: {
  workout: Workout;
  exercisesById: Map<string, Exercise>;
  bodyweightKg: number | null;
  now?: Date;
}): number {
  const { workout, exercisesById, bodyweightKg, now } = params;
  if (bodyweightKg === null || bodyweightKg <= 0) return 0;

  const mets = workout.exercises
    .map((entry) => exercisesById.get(entry.exerciseId)?.met)
    .filter((met): met is number => met !== undefined);

  // 3.5 is the MET floor for resistance work — roughly light effort.
  const averageMet = mets.length > 0 ? mets.reduce((a, b) => a + b, 0) / mets.length : 3.5;
  const minutes = durationSeconds(workout, now) / 60;

  return Math.round((averageMet * 3.5 * bodyweightKg) / 200 * minutes);
}

export function workoutMetrics(params: {
  workout: Workout;
  exercisesById: Map<string, Exercise>;
  bodyweightKg: number | null;
  now?: Date;
}): WorkoutMetrics {
  const { workout, now } = params;
  const sets = countSets(workout);

  return {
    totalVolumeKg: totalVolumeKg(workout),
    completedSets: sets.completed,
    totalSets: sets.total,
    durationSeconds: durationSeconds(workout, now),
    estimatedCalories: estimatedCalories(params),
  };
}

/** Seconds → "42:15" or "1:02:15". Used by the live duration readout. */
export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
