import type { AppError } from '@/core/errors';
import { ok, type Result } from '@/core/result';
import type {
  FormAnalysis,
  FormCheckExercise,
  FormCue,
  Recording,
} from '../domain/entities/form-check';
import type { FormAnalyzer } from '../domain/ports/form-analyzer';

/**
 * ============================================================================
 * SAMPLE ANALYZER. This does not look at the video. At all.
 * ============================================================================
 *
 * It produces example output so the flow, the screens and the result layout are
 * complete and testable while real analysis is unavailable. Real analysis needs
 * either a pose model on the device or a vision model behind an Edge Function —
 * a model key cannot ship in the client bundle, so there is no third option.
 *
 * Two deliberate constraints keep this from being dishonest:
 *
 *   1. Everything it returns is tagged `source: 'sample'`, and the UI renders a
 *      banner saying so. Nobody should be able to mistake this for a measurement
 *      of their actual lift.
 *   2. The rep count is derived only from recording duration and the exercise's
 *      known tempo — arithmetic the user can verify, not a fabricated reading.
 *      Under four seconds there is nothing to divide, so it returns null rather
 *      than inventing a number.
 *
 * Output is deterministic for a given exercise and duration. A result that
 * changed every time you opened it would make the placeholder obvious in the
 * worst way: by looking broken rather than by being labelled.
 */

/** Too short to contain a rep. Returning null beats guessing. */
const MIN_ANALYZABLE_SECONDS = 4;

/**
 * Per-exercise coaching cues.
 *
 * Real, conventional technique guidance — the kind a coach gives from the side
 * of the platform. General training advice only: nothing here diagnoses an
 * injury or tells anyone to work through pain.
 */
const CUE_LIBRARY: Record<string, FormCue[]> = {
  'back-squat': [
    {
      id: 'knee-track',
      severity: 'watch',
      title: 'Knee tracking',
      detail: 'Drive your knees out over your toes rather than letting them collapse inward.',
    },
    {
      id: 'depth',
      severity: 'good',
      title: 'Depth',
      detail: 'Hip crease reaching below the knee is a solid working depth.',
    },
    {
      id: 'torso',
      severity: 'fix',
      title: 'Torso angle',
      detail: 'Brace before you descend — losing the brace tips you forward out of the hole.',
    },
  ],
  'barbell-bench-press': [
    {
      id: 'bar-path',
      severity: 'watch',
      title: 'Bar path',
      detail: 'Aim for a slight arc from the lower chest back over the shoulders, not straight up.',
    },
    {
      id: 'elbow-flare',
      severity: 'fix',
      title: 'Elbow flare',
      detail: 'Around 45 degrees from the torso keeps load off the front of the shoulder.',
    },
    {
      id: 'shoulders',
      severity: 'good',
      title: 'Shoulder position',
      detail: 'Blades retracted and down gives you a stable base to press from.',
    },
  ],
  deadlift: [
    {
      id: 'lumbar',
      severity: 'fix',
      title: 'Lumbar position',
      detail: 'Set your back before the bar leaves the floor and hold that shape throughout.',
    },
    {
      id: 'timing',
      severity: 'watch',
      title: 'Hip and bar timing',
      detail: 'Hips rising faster than the bar turns the pull into a stiff-legged lift.',
    },
    {
      id: 'bar-distance',
      severity: 'good',
      title: 'Bar distance',
      detail: 'Keeping the bar against your legs shortens the lever and protects the back.',
    },
  ],
  'overhead-press': [
    {
      id: 'rib-flare',
      severity: 'fix',
      title: 'Rib flare',
      detail: 'Ribs down and glutes tight — arching under the bar shifts load to the lower back.',
    },
    {
      id: 'head',
      severity: 'watch',
      title: 'Head clearance',
      detail: 'Move your head back as the bar passes, then through as it locks out.',
    },
  ],
  'barbell-row': [
    {
      id: 'torso',
      severity: 'watch',
      title: 'Torso stability',
      detail: 'If your chest rises with each rep, the weight is doing the moving, not your back.',
    },
    {
      id: 'elbow-path',
      severity: 'good',
      title: 'Elbow path',
      detail: 'Pulling elbows toward the hip rather than flaring wide keeps the lats working.',
    },
  ],
  'pull-up': [
    {
      id: 'extension',
      severity: 'good',
      title: 'Full extension',
      detail: 'Reaching a dead hang at the bottom gets the full range from each rep.',
    },
    {
      id: 'kipping',
      severity: 'watch',
      title: 'Kipping',
      detail: 'Some leg drive late in a set is fine; from rep one it is doing the work for you.',
    },
  ],
  'push-up': [
    {
      id: 'hips',
      severity: 'fix',
      title: 'Hip alignment',
      detail: 'Squeeze the glutes so the hips travel with the shoulders instead of sagging.',
    },
    {
      id: 'depth',
      severity: 'watch',
      title: 'Depth',
      detail: 'Chest to roughly a fist off the floor makes each rep count.',
    },
  ],
  'bulgarian-split-squat': [
    {
      id: 'front-knee',
      severity: 'watch',
      title: 'Front knee tracking',
      detail: 'Keep the knee stacked over the mid-foot rather than drifting inward.',
    },
    {
      id: 'balance',
      severity: 'good',
      title: 'Balance',
      detail: 'A steady front foot means the working leg is controlling the descent.',
    },
  ],
};

function buildSummary(
  exercise: FormCheckExercise,
  repCount: number | null,
  cues: FormCue[],
): string {
  const toFix = cues.filter((cue) => cue.severity === 'fix');
  const reps =
    repCount === null
      ? 'The clip was too short to break into reps'
      : `That works out to about ${repCount} rep${repCount === 1 ? '' : 's'}`;

  if (toFix.length === 0) {
    return `${reps}. On ${exercise.name.toLowerCase()}, the things worth watching are ${exercise.watchPoints
      .slice(0, 2)
      .map((point) => point.toLowerCase())
      .join(' and ')}.`;
  }

  return `${reps}. The cue most lifters need on ${exercise.name.toLowerCase()} is ${toFix[0]!.title.toLowerCase()} — ${toFix[0]!.detail.toLowerCase()}`;
}

export function createSampleFormAnalyzer(): FormAnalyzer {
  return {
    async analyze({
      exercise,
      recording,
    }: {
      exercise: FormCheckExercise;
      recording: Recording;
    }): Promise<Result<FormAnalysis, AppError>> {
      const duration = recording.durationSeconds;

      const repCount =
        duration < MIN_ANALYZABLE_SECONDS
          ? null
          : Math.max(1, Math.round(duration / exercise.secondsPerRep));

      const cues = CUE_LIBRARY[exercise.id] ?? [];

      return ok({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        repCount,
        durationSeconds: duration,
        tempoSeconds: repCount === null ? null : duration / repCount,
        cues,
        summary: buildSummary(exercise, repCount, cues),
        source: 'sample',
      });
    },
  };
}
