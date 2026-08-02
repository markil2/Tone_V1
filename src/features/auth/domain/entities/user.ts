/**
 * Domain entity. Deliberately NOT Supabase's `User` type — the domain must not
 * know its persistence vendor. Mappers in ../../data translate between them.
 */
export type AuthUser = {
  id: string;
  email: string;
  /** True once the email has been confirmed. Gates onboarding in M2. */
  isVerified: boolean;
  createdAt: Date;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type Session = {
  user: AuthUser;
  expiresAt: Date | null;
};
