import type {
  Session as SupabaseSession,
  User as SupabaseUser,
} from '@supabase/supabase-js';

import { AppError } from '@/core/errors';
import type { AuthUser, Session } from '../domain/entities/user';

/**
 * Anti-corruption layer: Supabase shapes in, domain shapes out.
 *
 * This is the only place that knows a Supabase session carries
 * `expires_at` as Unix seconds, or that `email` is optional on their User type.
 */
export function toAuthUser(user: SupabaseUser): AuthUser {
  return {
    id: user.id,
    // Optional upstream because phone-only accounts exist; we don't support those.
    email: user.email ?? '',
    isVerified: Boolean(user.email_confirmed_at),
    createdAt: new Date(user.created_at),
  };
}

export function toSession(session: SupabaseSession | null): Session | null {
  if (!session?.user) return null;

  return {
    user: toAuthUser(session.user),
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
  };
}

/** Translate a Supabase auth failure into the app's error taxonomy. */
export function toAppError(error: { message: string; status?: number }): AppError {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return new AppError({ code: 'invalid_credentials', message: error.message });
  }
  // Match on the message, not the 422 status. GoTrue returns 422 for weak
  // passwords too, and telling someone their account already exists when the
  // real problem is password strength sends them to a sign-in screen where
  // nothing works.
  if (message.includes('already registered') || message.includes('already exists')) {
    return new AppError({
      code: 'conflict',
      message: error.message,
      userMessage: 'An account with that email already exists.',
    });
  }
  if (message.includes('password')) {
    return new AppError({
      code: 'validation',
      message: error.message,
      // Surface the server's own wording — it names the actual policy, which
      // the client cannot know.
      userMessage: error.message,
    });
  }
  if (message.includes('network') || message.includes('fetch')) {
    return new AppError({ code: 'network', message: error.message });
  }
  if (error.status === 401) {
    return new AppError({ code: 'unauthorized', message: error.message });
  }

  return new AppError({ code: 'unknown', message: error.message });
}
