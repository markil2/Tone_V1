import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { AppError } from '@/core/errors';

/**
 * TanStack Query owns all server state: logs, summaries, insights.
 *
 * Defaults are tuned for health data, which is appended far more often than it is
 * corrected — so a short stale window plus refetch-on-focus keeps the dashboard
 * honest without hammering Supabase.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        // RN has no window focus event; wired manually via focusManager below.
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Retrying an auth or validation failure just delays the error state.
          if (error instanceof AppError) {
            if (['unauthorized', 'validation', 'not_found'].includes(error.code)) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
      mutations: {
        // Writes are not idempotent by default; a blind retry can double-log.
        // Retry is opted into per-mutation once dedup keys exist (see M4).
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Held in state so Fast Refresh doesn't discard the cache on every edit.
  const [client] = useState(createQueryClient);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Bridge RN's AppState to Query's focus tracking, so returning to the app
    // refreshes stale dashboards — important after a watch workout syncs.
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });

    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * TODO(M11): offline-first.
 *   • wire `onlineManager` to @react-native-community/netinfo
 *   • add persistQueryClient with an MMKV/AsyncStorage persister
 *   • resume paused mutations on reconnect
 * The seam is here so none of that requires restructuring.
 */
export { onlineManager };
