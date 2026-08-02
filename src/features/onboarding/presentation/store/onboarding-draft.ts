import { create } from 'zustand';

import type { UnitSystem } from '@/shared/units';
import type {
  ActivityLevel,
  BiologicalSex,
  OnboardingAnswers,
  PrimaryGoal,
  TrackingPillar,
} from '../../domain/entities/onboarding';
import {
  AGE_RANGE,
  HEIGHT_CM_RANGE,
  TRAINING_DAYS_RANGE,
  WEIGHT_KG_RANGE,
} from '../../domain/use-cases/validation';

/**
 * In-progress onboarding answers.
 *
 * Zustand rather than TanStack Query because this is pure client state — it does
 * not exist on the server until the flow completes, at which point it is written
 * once. Keeping it out of the query cache avoids inventing a fake "draft"
 * resource that would need invalidating.
 */

/**
 * Best-effort locale guess so US users don't have to hunt for the unit toggle.
 * Wrong guesses are cheap — the toggle sits directly above the picker.
 */
function guessUnitSystem(): UnitSystem {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    // Intl.Locale, not locale.split('-')[1]: tags carrying a script subtag
    // ("en-Latn-US", "zh-Hant-TW") put the script at index 1, so the naive
    // split reads "LATN" as the region and silently falls back to metric.
    const region = new Intl.Locale(locale).region?.toUpperCase();
    // The only countries not on the metric system for body measurements.
    return region && ['US', 'LR', 'MM'].includes(region) ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

export type OnboardingDraft = {
  primaryGoal: PrimaryGoal | null;
  biologicalSex: BiologicalSex | null;
  activityLevel: ActivityLevel | null;
  /**
   * Pre-filled with population medians, and selected on focus so one keystroke
   * replaces them — the speed benefit of a default without forcing a clear.
   *
   * Nullable because typed entry has states a picker never had: empty, and
   * out-of-range. Null means "not a usable answer yet" and blocks Continue.
   */
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  trainingDaysPerWeek: number;
  focus: TrackingPillar[];
  unitSystem: UnitSystem;
};

type OnboardingStore = OnboardingDraft & {
  stepIndex: number;
  /**
   * Which user the current draft belongs to.
   *
   * This store is a module singleton, so without an owner it survives sign-out:
   * the next person to sign up on the same device would land on the final step
   * with the previous user's body metrics pre-filled, and one tap would write
   * them to their profile. `resetFor` is how that is prevented.
   */
  ownerId: string | null;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleFocus: (pillar: TrackingPillar) => void;
  goNext: (total: number) => void;
  goBack: () => void;
  reset: () => void;
  /** Clear the draft and bind it to a user. Call when the owner changes. */
  resetFor: (userId: string) => void;
  /** Draft → validated shape. Null fields fail the schema in the use-case. */
  toAnswers: () => Partial<OnboardingAnswers>;
};

const initialDraft: OnboardingDraft = {
  primaryGoal: null,
  biologicalSex: null,
  activityLevel: null,
  age: AGE_RANGE.default,
  heightCm: HEIGHT_CM_RANGE.default,
  weightKg: WEIGHT_KG_RANGE.default,
  trainingDaysPerWeek: TRAINING_DAYS_RANGE.default,
  // Pre-selected so the fastest path through the flow is a single tap on
  // Continue. Users who want less can deselect.
  focus: ['nutrition', 'hydration', 'sleep', 'training'],
  unitSystem: guessUnitSystem(),
};

export const useOnboardingDraft = create<OnboardingStore>((set, get) => ({
  ...initialDraft,
  stepIndex: 0,
  ownerId: null,

  setField: (key, value) => set({ [key]: value } as Pick<OnboardingDraft, typeof key>),

  toggleFocus: (pillar) =>
    set((state) => ({
      focus: state.focus.includes(pillar)
        ? state.focus.filter((p) => p !== pillar)
        : [...state.focus, pillar],
    })),

  goNext: (total) => set((state) => ({ stepIndex: Math.min(state.stepIndex + 1, total - 1) })),
  goBack: () => set((state) => ({ stepIndex: Math.max(state.stepIndex - 1, 0) })),

  reset: () => set({ ...initialDraft, stepIndex: 0, ownerId: null }),

  resetFor: (userId) => set({ ...initialDraft, stepIndex: 0, ownerId: userId }),

  toAnswers: () => {
    const s = get();
    return {
      primaryGoal: s.primaryGoal ?? undefined,
      biologicalSex: s.biologicalSex ?? undefined,
      activityLevel: s.activityLevel ?? undefined,
      age: s.age ?? undefined,
      heightCm: s.heightCm ?? undefined,
      weightKg: s.weightKg ?? undefined,
      trainingDaysPerWeek: s.trainingDaysPerWeek,
      focus: s.focus,
      unitSystem: s.unitSystem,
    };
  },
}));

/**
 * TODO(M2): persist the draft (zustand/middleware `persist` + AsyncStorage) so a
 * user who backgrounds the app mid-flow resumes instead of restarting. Worth
 * measuring drop-off first — persistence has its own staleness problems.
 */
