import type { MuscleStatus } from '../entities/dashboard';

/**
 * Recovery percentage → status.
 *
 * One function so the body map, the legend, the details card and the training
 * screen can never disagree about what "fatigued" means. Thresholds are
 * deliberately generous: this is a training aid, not a diagnostic, and telling
 * someone a muscle is fatigued when it is merely worked erodes trust in every
 * other number on the screen.
 */
export const RECOVERED_AT = 80;
export const BALANCED_AT = 55;

export function muscleStatusFromRecovery(recovery: number): MuscleStatus {
  if (recovery >= RECOVERED_AT) return 'recovered';
  if (recovery >= BALANCED_AT) return 'balanced';
  return 'fatigued';
}

/**
 * The suggestion shown on the details card.
 *
 * General training guidance only — never a medical claim, and never phrased as
 * an instruction the user is failing to follow.
 */
export function muscleRecommendation(status: MuscleStatus, trainingLoad: number): string {
  switch (status) {
    case 'recovered':
      return trainingLoad >= 60 ? 'Ready for volume' : 'Ready to train';
    case 'balanced':
      return trainingLoad >= 60 ? 'Light mobility' : 'Moderate work';
    case 'fatigued':
      return 'Rest or active recovery';
  }
}
