import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { Session } from '../entities/user';

export type Credentials = {
  email: string;
  password: string;
};

/**
 * Port (interface) for authentication.
 *
 * The domain depends on this; `data/supabase-auth.repository.ts` implements it.
 * Adding Sign in with Apple — required by App Store review once any third-party
 * sign-in exists — means one new method here plus one adapter method, with no
 * changes to use-cases or screens.
 */
export type AuthRepository = {
  signIn(credentials: Credentials): Promise<Result<Session, AppError>>;
  signUp(credentials: Credentials): Promise<Result<Session | null, AppError>>;
  signOut(): Promise<Result<void, AppError>>;
  getSession(): Promise<Result<Session | null, AppError>>;
  /** Subscribe to session changes. Returns an unsubscribe function. */
  onSessionChange(listener: (session: Session | null) => void): () => void;
};
