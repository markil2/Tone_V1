import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { FormAnalysis, FormCheckExercise, Recording } from '../entities/form-check';

/**
 * Turns a recording into form feedback.
 *
 * The port exists precisely because there are three plausible implementations
 * and the app will likely pass through all of them:
 *
 *   sample        — generated example output, no video read at all (today)
 *   on_device_pose — a pose model such as MoveNet, counting reps from joint
 *                    angles; works offline, costs bundle size
 *   server_vision  — the video posted to an Edge Function running a vision
 *                    model; strongest analysis, and the only place a model key
 *                    can live, since anything in the client bundle is readable
 *
 * Each returns the same `FormAnalysis`, tagged with its `source` so the UI can
 * be honest about which one produced the numbers on screen.
 */
export type FormAnalyzer = {
  analyze(input: {
    exercise: FormCheckExercise;
    recording: Recording;
  }): Promise<Result<FormAnalysis, AppError>>;
};
