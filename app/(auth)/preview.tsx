import { router } from 'expo-router';
import { useMemo } from 'react';

import { ok } from '@/core/result';
import { OnboardingScreen, makeCompleteOnboarding } from '@/features/onboarding';

/**
 * DEV-ONLY preview of the onboarding flow at /preview.
 *
 * Onboarding normally sits behind the auth and profile gates, which need a live
 * Supabase project. This route injects an in-memory repository instead, so the
 * real validation, target maths and summary all run with no network — the exact
 * substitution the OnboardingRepository port exists to allow.
 *
 * Renders nothing outside development, so it cannot ship. Delete once Supabase
 * is connected and the real flow is reachable.
 */
export default function OnboardingPreviewRoute() {
  const complete = useMemo(
    () => makeCompleteOnboarding({ complete: async () => ok(undefined) }),
    [],
  );

  if (!__DEV__) return null;

  return (
    <OnboardingScreen
      complete={complete}
      onComplete={() => router.replace('/(auth)/sign-in')}
    />
  );
}
