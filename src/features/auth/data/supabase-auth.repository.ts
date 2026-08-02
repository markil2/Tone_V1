import { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { supabase } from '@/lib/supabase';
import type { Session } from '../domain/entities/user';
import type { AuthRepository, Credentials } from '../domain/ports/auth-repository';
import { toAppError, toSession } from './mappers';

/**
 * Adapter implementing the AuthRepository port against Supabase.
 *
 * This is the ONLY file in the codebase permitted to touch `supabase.auth`.
 * Everything above it works in terms of the port, which is what makes the domain
 * unit-testable with a fake repository and no network.
 */
export function createSupabaseAuthRepository(): AuthRepository {
  return {
    async signIn({ email, password }: Credentials): Promise<Result<Session, AppError>> {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return err(toAppError(error));

      const session = toSession(data.session);
      if (!session) {
        return err(
          new AppError({ code: 'unknown', message: 'Sign-in returned no session' }),
        );
      }

      return ok(session);
    },

    async signUp({
      email,
      password,
    }: Credentials): Promise<Result<Session | null, AppError>> {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return err(toAppError(error));

      // Null when email confirmation is enabled — an expected outcome, not a failure.
      return ok(toSession(data.session));
    },

    async signOut(): Promise<Result<void, AppError>> {
      const { error } = await supabase.auth.signOut();
      if (error) return err(toAppError(error));
      return ok(undefined);
    },

    async getSession(): Promise<Result<Session | null, AppError>> {
      const { data, error } = await supabase.auth.getSession();
      if (error) return err(toAppError(error));
      return ok(toSession(data.session));
    },

    onSessionChange(listener: (session: Session | null) => void): () => void {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        listener(toSession(session));
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
