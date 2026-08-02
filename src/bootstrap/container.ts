import { createLocalAuthRepository } from '@/features/auth/data/local-auth.repository';
import { makeSignIn, makeSignOut, makeSignUp } from '@/features/auth/domain/use-cases';
import {
  baselineMetrics,
  createMockDashboardRepository,
} from '@/features/dashboard/data/mock-dashboard.repository';
import { createInitialDashboard } from '@/features/dashboard/domain/use-cases/create-initial-dashboard';
import type { DashboardSeed } from '@/features/dashboard/domain/use-cases/create-initial-dashboard';
import { createLocalOnboardingRepository } from '@/features/onboarding/data/local-onboarding.repository';
import { makeCompleteOnboarding } from '@/features/onboarding/domain/use-cases/complete-onboarding';
import { createLocalProfileRepository } from '@/features/profile/data/local-profile.repository';

/**
 * Composition root — the single place where interfaces are bound to
 * implementations.
 *
 * Deliberately a plain object rather than a DI framework: fully typed, trivially
 * debuggable, zero runtime magic, and no decorators or reflection metadata to
 * fight with in a React Native bundle.
 *
 * Swapping Supabase for another backend, or injecting fakes in tests, means
 * changing this file and nothing else.
 */
function createContainer() {
  /**
   * RUNNING WITHOUT A BACKEND.
   *
   * Auth, profile and onboarding are bound to device-local implementations, so
   * the app needs no Supabase project and no sign-in: it mints a local identity
   * on first launch, the survey saves to storage, and every screen reads from
   * there. The `supabase-*.repository.ts` files are untouched and still satisfy
   * the same ports — restoring the real backend is these three lines.
   *
   * Not shippable as-is: anyone holding the device is the user, and nothing
   * syncs anywhere.
   */
  const authRepository = createLocalAuthRepository();
  const onboardingRepository = createLocalOnboardingRepository();
  const profileRepository = createLocalProfileRepository();
  /**
   * Mock for now — there is no health data source until Milestone 8. Swapping in
   * HealthKit or a Supabase-backed adapter is this one line.
   */
  const dashboardRepository = createMockDashboardRepository();

  return {
    auth: {
      repository: authRepository,
      signIn: makeSignIn(authRepository),
      signUp: makeSignUp(authRepository),
      signOut: makeSignOut(authRepository),
    },
    onboarding: {
      repository: onboardingRepository,
      complete: makeCompleteOnboarding(onboardingRepository),
    },
    profile: {
      repository: profileRepository,
    },
    dashboard: {
      repository: dashboardRepository,
      /**
       * Seeds a first snapshot. Binding the baseline here keeps the presentation
       * layer from reaching into `data/` for it — the port stays the only way in.
       */
      createInitial: (seed: DashboardSeed) => createInitialDashboard(baselineMetrics(), seed),
    },
  };
}

export type Container = ReturnType<typeof createContainer>;

export const container: Container = createContainer();
