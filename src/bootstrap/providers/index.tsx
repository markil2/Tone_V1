import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design-system';
import { SessionProvider } from '@/features/auth';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';

/**
 * Every app-wide provider, composed once.
 *
 * Order matters and is deliberate:
 *   GestureHandler — must wrap anything using gestures (required at the root)
 *   SafeArea       — insets must resolve before any Screen renders
 *   Theme          — must be outside ErrorBoundary, whose fallback calls useTheme
 *   ErrorBoundary  — catches everything below it
 *   Query          — the cache must exist before SessionProvider triggers fetches
 *   Session        — depends on all of the above; drives the route guards
 *
 * Note the boundary is NOT outermost: it sits below the three providers its own
 * fallback UI depends on, so a throw inside those three is not caught. That is
 * an accepted tradeoff — they are static, dependency-free wrappers — but it is
 * a real limit, not an oversight.
 *
 * New global providers go here, never in app/_layout.tsx, so routing stays
 * purely about routing.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <QueryProvider>
              <SessionProvider>
                <StatusBar style="auto" />
                {children}
              </SessionProvider>
            </QueryProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export { ErrorBoundary } from './ErrorBoundary';
export { QueryProvider, createQueryClient } from './QueryProvider';
