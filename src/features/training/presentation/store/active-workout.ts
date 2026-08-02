import { create } from 'zustand';

import {
  createSet,
  createWorkout,
  createWorkoutExercise,
  type ActivityType,
  type Workout,
  type WorkoutSet,
} from '../../domain/entities/workout';

/**
 * The live workout.
 *
 * A single module-level store rather than screen state: a session outlives the
 * screen that started it. Navigating to the exercise library, backgrounding the
 * app, or opening settings mid-set must not discard sets already logged.
 *
 * Every mutation is immutable so React re-renders predictably, and so an undo
 * stack can be added later without rewriting the reducers.
 */

type ActiveWorkoutStore = {
  workout: Workout | null;
  /** Which exercise the session view is focused on, for auto-advance. */
  activeExerciseId: string | null;

  start: (activityType: ActivityType, name?: string) => void;
  discard: () => void;
  finish: (name: string) => Workout | null;

  addExercise: (exerciseId: string) => void;
  removeExercise: (workoutExerciseId: string) => void;
  /** Move an exercise to a new index — the drag handler's only writer. */
  reorderExercise: (from: number, to: number) => void;

  addSet: (workoutExerciseId: string) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<Pick<WorkoutSet, 'weightKg' | 'reps' | 'notes' | 'kind'>>,
  ) => void;
  completeSet: (workoutExerciseId: string, setId: string) => void;
  uncompleteSet: (workoutExerciseId: string, setId: string) => void;
  /** Copy the previous set's weight and reps into this one. */
  copyPreviousSet: (workoutExerciseId: string, setId: string) => void;
  setActiveExercise: (workoutExerciseId: string | null) => void;
};

/** Apply a change to one exercise, leaving the rest of the workout untouched. */
function mapExercise(
  workout: Workout,
  workoutExerciseId: string,
  fn: (exercise: Workout['exercises'][number]) => Workout['exercises'][number],
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      exercise.id === workoutExerciseId ? fn(exercise) : exercise,
    ),
  };
}

export const useActiveWorkout = create<ActiveWorkoutStore>((set, get) => ({
  workout: null,
  activeExerciseId: null,

  start: (activityType, name) =>
    set({ workout: createWorkout(activityType, name), activeExerciseId: null }),

  discard: () => set({ workout: null, activeExerciseId: null }),

  finish: (name) => {
    const { workout } = get();
    if (!workout) return null;

    const finished: Workout = {
      ...workout,
      name,
      endedAt: new Date().toISOString(),
      // Sets left untouched are noise in history, not a record of anything.
      exercises: workout.exercises
        .map((exercise) => ({
          ...exercise,
          sets: exercise.sets.filter((entry) => entry.isCompleted),
        }))
        .filter((exercise) => exercise.sets.length > 0),
    };

    set({ workout: null, activeExerciseId: null });
    return finished;
  },

  addExercise: (exerciseId) =>
    set((state) => {
      if (!state.workout) return state;
      const entry = createWorkoutExercise(exerciseId);

      return {
        workout: { ...state.workout, exercises: [...state.workout.exercises, entry] },
        activeExerciseId: entry.id,
      };
    }),

  removeExercise: (workoutExerciseId) =>
    set((state) => {
      if (!state.workout) return state;

      return {
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.filter(
            (exercise) => exercise.id !== workoutExerciseId,
          ),
        },
        activeExerciseId:
          state.activeExerciseId === workoutExerciseId ? null : state.activeExerciseId,
      };
    }),

  reorderExercise: (from, to) =>
    set((state) => {
      if (!state.workout) return state;

      const exercises = [...state.workout.exercises];
      const [moved] = exercises.splice(from, 1);
      if (!moved) return state;
      exercises.splice(to, 0, moved);

      return { workout: { ...state.workout, exercises } };
    }),

  addSet: (workoutExerciseId) =>
    set((state) => {
      if (!state.workout) return state;

      return {
        workout: mapExercise(state.workout, workoutExerciseId, (exercise) => {
          // A new set inherits the last one's numbers — the overwhelmingly
          // common case is the same weight again, and pre-filling removes two
          // taps per set across a whole session.
          const previous = exercise.sets.at(-1);

          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              createSet({ weightKg: previous?.weightKg ?? null, reps: previous?.reps ?? null }),
            ],
          };
        }),
      };
    }),

  removeSet: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.workout) return state;

      return {
        workout: mapExercise(state.workout, workoutExerciseId, (exercise) => ({
          ...exercise,
          sets: exercise.sets.filter((entry) => entry.id !== setId),
        })),
      };
    }),

  updateSet: (workoutExerciseId, setId, patch) =>
    set((state) => {
      if (!state.workout) return state;

      return {
        workout: mapExercise(state.workout, workoutExerciseId, (exercise) => ({
          ...exercise,
          sets: exercise.sets.map((entry) =>
            entry.id === setId ? { ...entry, ...patch } : entry,
          ),
        })),
      };
    }),

  completeSet: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.workout) return state;

      return {
        workout: mapExercise(state.workout, workoutExerciseId, (exercise) => ({
          ...exercise,
          sets: exercise.sets.map((entry) =>
            entry.id === setId
              ? { ...entry, isCompleted: true, completedAt: new Date().toISOString() }
              : entry,
          ),
        })),
      };
    }),

  uncompleteSet: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.workout) return state;

      return {
        workout: mapExercise(state.workout, workoutExerciseId, (exercise) => ({
          ...exercise,
          sets: exercise.sets.map((entry) =>
            entry.id === setId ? { ...entry, isCompleted: false, completedAt: null } : entry,
          ),
        })),
      };
    }),

  copyPreviousSet: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.workout) return state;

      return {
        workout: mapExercise(state.workout, workoutExerciseId, (exercise) => {
          const index = exercise.sets.findIndex((entry) => entry.id === setId);
          const previous = index > 0 ? exercise.sets[index - 1] : undefined;
          if (!previous) return exercise;

          return {
            ...exercise,
            sets: exercise.sets.map((entry) =>
              entry.id === setId
                ? { ...entry, weightKg: previous.weightKg, reps: previous.reps }
                : entry,
            ),
          };
        }),
      };
    }),

  setActiveExercise: (workoutExerciseId) => set({ activeExerciseId: workoutExerciseId }),
}));
