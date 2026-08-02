/**
 * The muscle vocabulary.
 *
 * Kept separate from the dashboard entity because the body map, the legend, the
 * training screen and any future workout logger all need the same identifiers —
 * and they must never drift apart. `MuscleId` is the join key between rendered
 * SVG geometry and health data.
 */

export const MUSCLE_IDS = [
  'deltoid',
  'pectoral',
  'biceps',
  'triceps',
  'abdominals',
  'quadriceps',
  'hamstrings',
  'calves',
] as const;

export type MuscleId = (typeof MUSCLE_IDS)[number];

export const MUSCLE_LABELS: Record<MuscleId, string> = {
  deltoid: 'Deltoids',
  pectoral: 'Pectorals',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abdominals: 'Abdominals',
  quadriceps: 'Quadriceps',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

/** Coarse grouping, used to summarise readiness without listing eight muscles. */
export const MUSCLE_REGIONS = {
  deltoid: 'upper',
  pectoral: 'upper',
  biceps: 'upper',
  triceps: 'upper',
  abdominals: 'core',
  quadriceps: 'lower',
  hamstrings: 'lower',
  calves: 'lower',
} as const satisfies Record<MuscleId, 'upper' | 'core' | 'lower'>;

export type MuscleRegionName = (typeof MUSCLE_REGIONS)[MuscleId];

export const MUSCLE_REGION_LABELS: Record<MuscleRegionName, string> = {
  upper: 'Upper body',
  core: 'Core',
  lower: 'Lower body',
};

export function isMuscleId(value: string): value is MuscleId {
  return (MUSCLE_IDS as readonly string[]).includes(value);
}
