import { AppError } from '@/core/errors';
import { ok, type Result } from '@/core/result';
import { getLocalUserId, resetLocalUser } from '@/lib/local-store';
import type { Session } from '../domain/entities/user';
import type { AuthRepository, Credentials } from '../domain/ports/auth-repository';

/**
 * Auth without an auth provider.
 *
 * The app currently runs with sign-in removed, so there is nobody to
 * authenticate — but everything above this port still expects a session, since
 * a user id is what namespaces every stored record. This satisfies the port with
 * a device-local identity: the session always exists, so the route guard's
 * unauthenticated branch never fires and the sign-in screen is never reached.
 *
 * That is the point of the port. Restoring real auth is one line in
 * `container.ts`, with no screen or guard touched.
 *
 * The security tradeoff is explicit and total: anyone holding the device is the
 * user. That is acceptable only because nothing here leaves the device and no
 * real account exists to compromise. It must not ship.
 */
export function createLocalAuthRepository(): AuthRepository {
  const listeners = new Set<(session: Session | null) => void>();

  async function currentSession(): Promise<Session> {
    const userId = await getLocalUserId();

    return {
      user: {
        id: userId,
        email: '',
        // Nothing to verify without a provider; treating it as verified keeps
        // any future email-confirmation gate from blocking a local user.
        isVerified: true,
        createdAt: new Date(),
      },
      // Never expires — there is no token to refresh.
      expiresAt: null,
    };
  }

  function broadcast(session: Session | null): void {
    for (const listener of listeners) listener(session);
  }

  return {
    async signIn(_credentials: Credentials): Promise<Result<Session, AppError>> {
      // Reachable only via the dev-preview auth routes. Succeeds into the same
      // local identity rather than pretending to check a password.
      const session = await currentSession();
      broadcast(session);
      return ok(session);
    },

    async signUp(_credentials: Credentials): Promise<Result<Session | null, AppError>> {
      const session = await currentSession();
      broadcast(session);
      return ok(session);
    },

    /** With no account to leave, this clears the device and starts fresh. */
    async signOut(): Promise<Result<void, AppError>> {
      await resetLocalUser();
      const session = await currentSession();
      // A new identity, so every user-scoped screen re-seeds from empty.
      broadcast(session);
      return ok(undefined);
    },

    async getSession(): Promise<Result<Session | null, AppError>> {
      return ok(await currentSession());
    },

    onSessionChange(listener: (session: Session | null) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
