import { router } from 'expo-router';

import { OnboardingScreen } from '@/features/onboarding';

export default function OnboardingRoute() {
  return (
    // replace, not push: onboarding must not remain on the back stack.
    <OnboardingScreen onComplete={() => router.replace('/dashboard')} />
  );
}
