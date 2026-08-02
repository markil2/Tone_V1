import type { MuscleGroup } from '@/features/training';

/**
 * Form check domain model.
 *
 * The important type here is `FormAnalysis.source`. Every consumer must be able
 * to tell a real measurement from a generated example, because the difference
 * matters enormously to a user deciding whether their knees caved on rep seven.
 * Making it a required field means no screen can render a result without having
 * decided how to label it.
 */

export const ANALYSIS_SOURCES = ['sample', 'on_device_pose', 'server_vision'] as const;
export type AnalysisSource = (typeof ANALYSIS_SOURCES)[number];

export const CUE_SEVERITIES = ['good', 'watch', 'fix'] as const;
export type CueSeverity = (typeof CUE_SEVERITIES)[number];

export const CUE_SEVERITY_LABELS: Record<CueSeverity, string> = {
  good: 'Looking good',
  watch: 'Keep an eye on',
  fix: 'Worth fixing',
};

export type FormCue = {
  id: string;
  severity: CueSeverity;
  title: string;
  detail: string;
};

export type FormAnalysis = {
  exerciseId: string;
  exerciseName: string;
  /** Null when reps could not be determined — never guess a number silently. */
  repCount: number | null;
  durationSeconds: number;
  /** Average seconds per rep. Null whenever `repCount` is. */
  tempoSeconds: number | null;
  cues: FormCue[];
  summary: string;
  /** How this result was produced. Drives the honesty banner in the UI. */
  source: AnalysisSource;
};

/** What a recording produced, before analysis. */
export type Recording = {
  /** Local file or blob URI. Null when the camera was unavailable. */
  uri: string | null;
  durationSeconds: number;
  recordedAt: string;
};

/**
 * Exercises the form checker offers.
 *
 * Deliberately a short list rather than the full training catalogue: form
 * feedback only means something for movements with well-known failure modes, and
 * offering it for all 140 exercises would imply a depth of analysis that does
 * not exist.
 */
export type FormCheckExercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** Typical seconds for one controlled rep — used for the tempo readout. */
  secondsPerRep: number;
  /** What a coach actually watches for on this movement. */
  watchPoints: string[];
};

export const FORM_CHECK_EXERCISES: FormCheckExercise[] = [
  {
    id: 'back-squat',
    name: 'Back Squat',
    muscleGroup: 'legs',
    secondsPerRep: 4,
    watchPoints: ['Knee tracking', 'Depth', 'Torso angle', 'Heel contact'],
  },
  {
    id: 'barbell-bench-press',
    name: 'Bench Press',
    muscleGroup: 'chest',
    secondsPerRep: 3.5,
    watchPoints: ['Bar path', 'Elbow flare', 'Shoulder position', 'Wrist stacking'],
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroup: 'back',
    secondsPerRep: 5,
    watchPoints: ['Lumbar position', 'Hip and bar timing', 'Bar distance', 'Lockout'],
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroup: 'shoulders',
    secondsPerRep: 3.5,
    watchPoints: ['Rib flare', 'Head clearance', 'Lockout position', 'Bracing'],
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscleGroup: 'back',
    secondsPerRep: 3,
    watchPoints: ['Torso stability', 'Elbow path', 'Range of motion', 'Neck position'],
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscleGroup: 'back',
    secondsPerRep: 3.5,
    watchPoints: ['Full extension', 'Scapular engagement', 'Kipping', 'Chin clearance'],
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    muscleGroup: 'chest',
    secondsPerRep: 2.5,
    watchPoints: ['Hip alignment', 'Elbow angle', 'Depth', 'Head position'],
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    muscleGroup: 'legs',
    secondsPerRep: 4,
    watchPoints: ['Front knee tracking', 'Torso lean', 'Balance', 'Depth'],
  },
];

export function findFormCheckExercise(id: string): FormCheckExercise | undefined {
  return FORM_CHECK_EXERCISES.find((exercise) => exercise.id === id);
}

export function formatTempo(seconds: number | null): string {
  if (seconds === null) return '—';
  return `${seconds.toFixed(1)}s`;
}
