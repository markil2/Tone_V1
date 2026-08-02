import { AppError } from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { Session } from '../entities/user';
import type { AuthRepository, Credentials } from '../ports/auth-repository';
import { credentialsSchema } from './validation';

/**
 * Use-case: validate input, then delegate to the repository.
 *
 * Validation lives here rather than in the screen so that every entry point —
 * a form, a deep link, a future watch handoff — is held to the same rules.
 */
export function makeSignIn(repository: AuthRepository) {
  return async (input: Credentials): Promise<Result<Session, AppError>> => {
    const parsed = credentialsSchema.safeParse(input);

    if (!parsed.success) {
      return err(
        new AppError({
          code: 'validation',
          message: 'Invalid sign-in input',
          userMessage: parsed.error.issues[0]?.message ?? 'Please check your details.',
        }),
      );
    }

    return repository.signIn(parsed.data);
  };
}

export type SignIn = ReturnType<typeof makeSignIn>;
