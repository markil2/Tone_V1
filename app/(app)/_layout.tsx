import { Redirect, Stack, usePathname } from 'expo-router';

import { RetryScreen } from '@/bootstrap/providers/RetryScreen';
import { SplashGate } from '@/bootstrap/providers/SplashGate';
import { useSession } from '@/features/auth';
import { useProfile } from '@/features/profile';

/**
 * Authenticated group — two gates, in order.
 *
 *   1. No session             → sign-in
 *   2. Session, not onboarded → onboarding
 *
 * Both live here rather than in individual screens, so any route added under
 * (app) inherits them automatically.
 *
 * Note that gate 1 currently never fires: the container binds a device-local
 * auth repository whose session always exists, which is how sign-in was removed
 * without touching any routing. The branch stays because restoring real auth is
 * a one-line container change, and this file should not need editing when it
 * happens.
 */
export default function AppLayout() {
  const { status } = useSession();
  const pathname = usePathname();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    isFetching: isProfileFetching,
    refetch: refetchProfile,
  } = useProfile();

  if (status === 'loading') return <SplashGate />;
  if (status === 'unauthenticated') return <Redirect href="/(auth)/sign-in" />;

  // Onboarding itself lives inside this group (it needs a session), so it must
  // be exempt from the gate or the redirect would loop.
  const isOnboardingRoute = pathname === '/onboarding';

  if (!isOnboardingRoute) {
    if (isProfileLoading) return <SplashGate />;

    /**
     * A failed fetch must NOT fall through to the onboarding redirect.
     *
     * On error `data` is undefined, which is indistinguishable from "not
     * onboarded" — so an already-onboarded user opening the app offline would be
     * pushed into onboarding, where the save also fails. That is a trap with no
     * exit. Offer a retry instead.
     */
    if (isProfileError) {
      return <RetryScreen onRetry={() => void refetchProfile()} isRetrying={isProfileFetching} />;
    }

    // A null profile means the survey has not been completed yet.
    if (!profile?.isOnboarded) return <Redirect href="/onboarding" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="onboarding"
        options={{
          // No swipe-back out of onboarding — leaving it half-done strands the
          // user on a dashboard with no targets.
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      {/* Profile and settings are routes rather than in-screen overlays so they
          are deep-linkable and the hardware back button dismisses them. */}
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
