/** Public API of the onboarding feature. */
export { OnboardingScreen } from './presentation/screens/OnboardingScreen';
export {
  computeDailyTargets,
  sleepTargetForTrainingDays,
} from './domain/use-cases/compute-targets';
export { useOnboardingDraft } from './presentation/store/onboarding-draft';
export { makeCompleteOnboarding } from './domain/use-cases/complete-onboarding';
export type { CompleteOnboarding } from './domain/use-cases/complete-onboarding';
export type {
  ActivityLevel,
  BiologicalSex,
  DailyTargets,
  OnboardingAnswers,
  OnboardingResult,
  PrimaryGoal,
  TrackingPillar,
} from './domain/entities/onboarding';
