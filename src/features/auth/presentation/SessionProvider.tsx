import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { logger } from '@/core/logger';
import { isOk } from '@/core/result';
import { container } from '@/bootstrap/container';
import type { AuthStatus, Session } from '../domain/entities/user';

type SessionContextValue = {
  status: AuthStatus;
  session: Session | null;
  /** Convenience accessor — every user-scoped query needs this id. */
  userId: string | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Single source of truth for auth state.
 *
 * Session lives in Context rather than TanStack Query because it is not
 * fetched-and-cached data — it is a push-based subscription that Supabase drives
 * (token refresh, sign-out on another device, deep-link callbacks). Modelling it
 * as a query would mean fighting staleness rules for no benefit.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;

    const applySession = (next: Session | null) => {
      if (!active) return;
      setSession(next);
      setStatus(next ? 'authenticated' : 'unauthenticated');
    };

    // 1. Restore any persisted session from SecureStore.
    void container.auth.repository.getSession().then((result) => {
      if (isOk(result)) {
        applySession(result.value);
      } else {
        logger.error('Failed to restore session', result.error);
        applySession(null); // fail closed — an unreadable session is no session
      }
    });

    // 2. Then track changes for the rest of the app's lifetime.
    const unsubscribe = container.auth.repository.onSessionChange(applySession);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, session, userId: session?.user.id ?? null }),
    [status, session],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used within a <SessionProvider>.');
  return value;
}

/**
 * For screens inside the (app) group, where the route guard has already proven a
 * session exists. Saves every feature hook from re-null-checking `userId`.
 */
export function useRequireUserId(): string {
  const { userId } = useSession();
  if (!userId) throw new Error('useRequireUserId used outside an authenticated route.');
  return userId;
}
