/**
 * The exercise vocabulary.
 *
 * `MuscleGroup` is the filter axis in the library and deliberately coarser than
 * the dashboard's `MuscleId`: people browse for "back", not for "latissimus
 * dorsi". `muscleGroupToBodyMuscles` maps between the two so a logged set can
 * still drive the body map.
 */

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'core',
  'legs',
  'glutes',
  'calves',
  'forearms',
  'full_body',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  legs: 'Legs',
  glutes: 'Glutes',
  calves: 'Calves',
  forearms: 'Forearms',
  full_body: 'Full body',
};

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'smith',
  'ez_bar',
  'trap_bar',
  'other',
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
  smith: 'Smith machine',
  ez_bar: 'EZ bar',
  trap_bar: 'Trap bar',
  other: 'Other',
};

export type Exercise = {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  /** Multi-joint movements seed a session's heavy work and sort first. */
  isCompound: boolean;
  /**
   * Metabolic equivalent, used for the calorie estimate. Resistance training
   * sits roughly 3.5–6.0 depending on how much mass is moving.
   */
  met: number;
  /** Alternate names people actually search for ("bench", "OHP", "RDL"). */
  aliases: string[];
};

/**
 * Search key for one exercise.
 *
 * Precomputed rather than rebuilt per keystroke — the library is searched on
 * every character and this is the only allocation-heavy part of matching.
 */
export function searchKey(exercise: Exercise): string {
  return [exercise.name, ...exercise.aliases, EQUIPMENT_LABELS[exercise.equipment]]
    .join(' ')
    .toLowerCase();
}
