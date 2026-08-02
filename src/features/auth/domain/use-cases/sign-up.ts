import { AppError } from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { Session } from '../entities/user';
import type { AuthRepository, Credentials } from '../ports/auth-repository';
import { credentialsSchema } from './validation';

/**
 * Resolves to `null` when the project requires email confirmation — the account
 * exists but no session is issued yet. Callers must handle that case rather than
 * assuming a successful sign-up means the user is signed in.
 */
export function makeSignUp(repository: AuthRepository) {
  return async (input: Credentials): Promise<Result<Session | null, AppError>> => {
    const parsed = credentialsSchema.safeParse(input);

    if (!parsed.success) {
      return err(
        new AppError({
          code: 'validation',
          message: 'Invalid sign-up input',
          userMessage: parsed.error.issues[0]?.message ?? 'Please check your details.',
        }),
      );
    }

    return repository.signUp(parsed.data);
  };
}

export type SignUp = ReturnType<typeof makeSignUp>;
