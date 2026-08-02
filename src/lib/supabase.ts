import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from '@/core/config/env';
import type { Database } from './database.types';
import { sessionStorage } from './supabase-storage';

/**
 * The single Supabase client instance.
 *
 * Typed with the generated `Database` type, so every query and RPC is checked
 * against the real schema at compile time. Regenerate after each migration:
 * `npm run db:types`.
 *
 * Import this in exactly one kind of place: repositories under
 * `features/<name>/data/`. Screens, hooks and domain code go through a
 * repository instead — that boundary is what keeps Supabase swappable and the
 * domain testable without a network. ESLint enforces it.
 *
 * There must only ever be ONE client in the process. A second instance sharing
 * the same storage key produces "Multiple GoTrueClient instances detected" and
 * races two token refreshes against each other.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no URL bar to parse a session out of.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

/**
 * Refresh tokens only while the app is foregrounded.
 *
 * Without this, supabase-js keeps a timer running in the background, burning
 * battery and firing failed refreshes; and on resume the access token may already
 * be stale, so the first query after a long backgrounding 401s.
 */
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
