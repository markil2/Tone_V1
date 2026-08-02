import type {
  ActivityLevel,
  BiologicalSex,
  PrimaryGoal,
  TrackingPillar,
} from '../../domain/entities/onboarding';
import type { OnboardingDraft } from '../store/onboarding-draft';

/**
 * The flow, as data.
 *
 * Order, sectioning and progress are all derived from this array, so adding or
 * reordering a question is a one-line change here plus a case in StepRenderer.
 * Copy lives here too, which is where an i18n layer would slot in.
 */

export type StepId =
  | 'goal'
  | 'sex'
  | 'age'
  | 'body'
  | 'activity'
  | 'training'
  | 'focus';

export type SectionId = 'goal' | 'about' | 'activity' | 'focus';

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'goal', label: 'Goal' },
  { id: 'about', label: 'About you' },
  { id: 'activity', label: 'Activity' },
  { id: 'focus', label: 'Focus' },
];

export type StepDef = {
  id: StepId;
  section: SectionId;
  title: string;
  subtitle?: string;
  /**
   * Whether the user may advance. Numeric steps are always satisfiable because
   * they are pre-filled; only genuine choices can block.
   */
  isAnswered: (draft: OnboardingDraft) => boolean;
  /** Choice steps advance on tap; picker steps need an explicit Continue. */
  autoAdvance: boolean;
};

export const STEPS: StepDef[] = [
  {
    id: 'goal',
    section: 'goal',
    title: "What's your main goal?",
    subtitle: 'This shapes your calorie and macro targets.',
    isAnswered: (d) => d.primaryGoal !== null,
    autoAdvance: true,
  },
  {
    id: 'sex',
    section: 'about',
    title: 'Biological sex',
    subtitle: 'Used to calculate your metabolic rate.',
    isAnswered: (d) => d.biologicalSex !== null,
    autoAdvance: true,
  },
  {
    id: 'age',
    section: 'about',
    title: 'How old are you?',
    subtitle: 'Metabolism shifts with age.',
    // Null means empty or out of range — typed entry can produce both.
    isAnswered: (d) => d.age !== null,
    autoAdvance: false,
  },
  {
    // Height and weight share a screen — they are the same gesture twice, and
    // merging them removes a full step from the flow.
    id: 'body',
    section: 'about',
    title: 'Height and weight',
    subtitle: 'The foundation of every target we calculate.',
    isAnswered: (d) => d.heightCm !== null && d.weightKg !== null,
    autoAdvance: false,
  },
  {
    id: 'activity',
    section: 'activity',
    title: 'How active are you day to day?',
    subtitle: 'Outside of deliberate training.',
    isAnswered: (d) => d.activityLevel !== null,
    autoAdvance: true,
  },
  {
    id: 'training',
    section: 'activity',
    title: 'Training days per week',
    subtitle: 'Sets your hydration and sleep targets.',
    isAnswered: () => true,
    autoAdvance: false,
  },
  {
    id: 'focus',
    section: 'focus',
    title: 'What do you want to track?',
    subtitle: 'Pick any. You can change this later.',
    isAnswered: (d) => d.focus.length > 0,
    autoAdvance: false,
  },
];

/* --------------------------------- options --------------------------------- */

export const GOAL_OPTIONS: {
  value: PrimaryGoal;
  label: string;
  description: string;
  glyph: string;
}[] = [
  {
    value: 'lose_weight',
    label: 'Lose weight',
    description: 'A moderate, sustainable calorie deficit',
    glyph: '↓',
  },
  {
    value: 'build_muscle',
    label: 'Build muscle',
    description: 'Lean surplus with high protein',
    glyph: '↑',
  },
  {
    value: 'improve_performance',
    label: 'Improve performance',
    description: 'Fuel training and prioritise recovery',
    glyph: '⚡',
  },
  {
    value: 'maintain_fitness',
    label: 'Maintain fitness',
    description: 'Hold your current shape and habits',
    glyph: '=',
  },
];

export const SEX_OPTIONS: { value: BiologicalSex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
  glyph: string;
}[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Desk job, little walking',
    glyph: '◔',
  },
  {
    value: 'moderately_active',
    label: 'Moderately active',
    description: 'On your feet part of the day',
    glyph: '◑',
  },
  {
    value: 'very_active',
    label: 'Very active',
    description: 'Physical job or constant movement',
    glyph: '●',
  },
];

export const FOCUS_OPTIONS: {
  value: TrackingPillar;
  label: string;
  glyph: string;
}[] = [
  { value: 'nutrition', label: 'Nutrition', glyph: '◆' },
  { value: 'hydration', label: 'Hydration', glyph: '◇' },
  { value: 'sleep', label: 'Sleep', glyph: '☾' },
  { value: 'training', label: 'Training', glyph: '▲' },
  { value: 'recovery', label: 'Recovery', glyph: '◈' },
];
