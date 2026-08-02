/**
 * A closed taxonomy of application errors.
 *
 * Adapters translate vendor-specific failures (PostgrestError, AuthError,
 * HealthKit errors) into these before they cross into the domain, so the domain
 * and UI never branch on a Supabase error code.
 */

export type AppErrorCode =
  | 'unauthorized' // no/expired session
  | 'invalid_credentials'
  | 'validation' // input failed a schema check
  | 'not_found'
  | 'conflict' // uniqueness violation, concurrent write
  | 'network' // offline / request failed
  | 'permission' // OS-level denial (HealthKit, notifications)
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  override readonly cause?: unknown;
  /** Safe to render directly to the user. */
  readonly userMessage: string;

  constructor(params: {
    code: AppErrorCode;
    message: string;
    userMessage?: string;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.code = params.code;
    this.cause = params.cause;
    this.userMessage = params.userMessage ?? DEFAULT_USER_MESSAGE[params.code];
  }

  static from(cause: unknown, code: AppErrorCode = 'unknown'): AppError {
    if (cause instanceof AppError) return cause;
    const message = cause instanceof Error ? cause.message : String(cause);
    return new AppError({ code, message, cause });
  }
}

const DEFAULT_USER_MESSAGE: Record<AppErrorCode, string> = {
  unauthorized: 'Your session has expired. Please sign in again.',
  invalid_credentials: 'That email or password is incorrect.',
  validation: 'Please check the information you entered.',
  not_found: "We couldn't find what you were looking for.",
  conflict: 'That change conflicts with existing data.',
  network: "You appear to be offline. We'll retry when you reconnect.",
  permission: 'Permission is required to continue.',
  unknown: 'Something went wrong. Please try again.',
};
