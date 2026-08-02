/** Public API of the training feature. */
export { TrainingScreen } from './presentation/screens/TrainingScreen';
export { WorkoutSessionScreen } from './presentation/screens/WorkoutSessionScreen';
export { useActiveWorkout } from './presentation/store/active-workout';
export type { SessionMode, TrainingScreenProps } from './presentation/screens/TrainingScreen';

export {
  ACTIVITY_LABELS,
  ACTIVITY_TYPES,
  createSet,
  createWorkout,
  createWorkoutExercise,
} from './domain/entities/workout';
export type {
  ActivityType,
  Routine,
  RoutineExercise,
  RoutineSource,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from './domain/entities/workout';

export {
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
} from './domain/entities/exercise';
export type { Equipment, Exercise, MuscleGroup } from './domain/entities/exercise';

export { formatElapsed, workoutMetrics } from './domain/use-cases/workout-metrics';
export type { WorkoutMetrics } from './domain/use-cases/workout-metrics';
export { findBrokenRecords, mergeRecords } from './domain/use-cases/personal-records';
export type { PersonalRecord } from './domain/use-cases/personal-records';

export { EXERCISE_CATALOGUE } from './data/exercise-catalogue';
