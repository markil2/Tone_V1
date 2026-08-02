import { router } from 'expo-router';

import { NutritionScreen } from '@/features/nutrition';

/**
 * DEV-ONLY preview of the Nutrition page at /preview-nutrition.
 *
 * Nutrition normally sits behind the auth and onboarding gates, which need a
 * live Supabase project. Every hook it depends on degrades to null without a
 * session — targets fall back to the mock day, and the dashboard metrics that
 * feed the guidance engine simply stay absent — so the page renders in full.
 *
 * Mirrors the existing /preview route for onboarding. Renders nothing outside
 * development, so it cannot ship.
 */
export default function NutritionPreviewRoute() {
  if (!__DEV__) return null;

  return (
    <NutritionScreen
      onOpenProfile={() => router.push('/sign-in')}
      onOpenSettings={() => router.push('/sign-in')}
    />
  );
}
