import { Stack } from 'expo-router';

import { AppProviders } from '@/bootstrap/providers';

/**
 * Root layout. Providers only — every routing decision happens in the group
 * layouts below, so this file never needs to change as features are added.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AppProviders>
  );
}
