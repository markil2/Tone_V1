import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth';
import { SplashGate } from '@/bootstrap/providers/SplashGate';

/**
 * Unauthenticated group.
 *
 * Guarding at the layout means every screen in this group — now and in future —
 * is covered without anyone remembering to add a check.
 */
export default function AuthLayout() {
  const { status } = useSession();

  if (status === 'loading') return <SplashGate />;
  if (status === 'authenticated') return <Redirect href="/(app)/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
