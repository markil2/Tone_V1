import type { MuscleGroup } from './exercise';

/**
 * A workout in progress or in history.
 *
 * Weights are stored in kilograms without exception — the same SI rule the rest
 * of the app follows. Pounds exist only at the input and display edge, so a user
 * switching units never rewrites their history.
 *
 * Timestamps are ISO strings rather than `Date` because these objects are
 * persisted and round-tripped through JSON; a `Date` would silently become a
 * string on read and break every comparison.
 */

export const ACTIVITY_TYPES = ['run', 'walk', 'cycle', 'sports', 'weightlifting'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  walk: 'Walk',
  cycle: 'Cycle',
  sports: 'Sports',
  weightlifting: 'Weightlifting',
};

/** Warm-up sets are logged but excluded from volume and personal records. */
export type SetKind = 'working' | 'warmup';

export type WorkoutSet = {
  id: string;
  kind: SetKind;
  weightKg: number | null;
  reps: number | null;
  notes: string | null;
  isCompleted: boolean;
  completedAt: string | null;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes: string | null;
};

export type Workout = {
  id: string;
  name: string;
  activityType: ActivityType;
  startedAt: string;
  /** Null while the session is live. */
  endedAt: string | null;
  /** Ordered — array position *is* the order, so a drag is a splice. */
  exercises: WorkoutExercise[];
  /** Set when the session was started from a saved routine. */
  routineId: string | null;
};

/* --------------------------------- routines -------------------------------- */

export type RoutineExercise = {
  exerciseId: string;
  targetSets: number;
  targetReps: number | null;
  targetWeightKg: number | null;
};

/**
 * `source` exists so an AI-generated plan is a first-class routine rather than a
 * special case: the generator writes rows with `source: 'ai'` and every existing
 * screen renders them unchanged.
 */
export type RoutineSource = 'user' | 'ai' | 'template';

export type Routine = {
  id: string;
  name: string;
  source: RoutineSource;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
  /** Denormalised for list rendering, so showing routines needs no join. */
  primaryMuscles: MuscleGroup[];
};

/* ------------------------------- constructors ------------------------------ */

/**
 * Ids are generated here rather than by the database.
 *
 * A set has to exist — and be reorderable and completable — the instant it is
 * tapped into existence, long before anything is persisted. Client-generated ids
 * also make the eventual sync idempotent: re-sending a workout cannot duplicate
 * its sets.
 */
export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: createId('set'),
    kind: 'working',
    weightKg: null,
    reps: null,
    notes: null,
    isCompleted: false,
    completedAt: null,
    ...overrides,
  };
}

export function createWorkoutExercise(exerciseId: string, sets = 1): WorkoutExercise {
  return {
    id: createId('we'),
    exerciseId,
    sets: Array.from({ length: sets }, () => createSet()),
    notes: null,
  };
}

export function createWorkout(
  activityType: ActivityType = 'weightlifting',
  name = 'Free workout',
): Workout {
  return {
    id: createId('wk'),
    name,
    activityType,
    startedAt: new Date().toISOString(),
    endedAt: null,
    exercises: [],
    routineId: null,
  };
}
