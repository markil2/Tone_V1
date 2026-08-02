import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { AuthRepository } from '../ports/auth-repository';

export function makeSignOut(repository: AuthRepository) {
  return (): Promise<Result<void, AppError>> => repository.signOut();
}

export type SignOut = ReturnType<typeof makeSignOut>;
