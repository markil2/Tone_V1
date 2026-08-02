/**
 * Result<T, E> — explicit success/failure at domain boundaries.
 *
 * Use-cases return Result instead of throwing so that failure modes are part of
 * the type signature and callers are forced to handle them. Exceptions are
 * reserved for genuinely exceptional, unrecoverable situations.
 */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;

/** Map the success value, leaving errors untouched. */
export const mapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> => (result.ok ? ok(fn(result.value)) : result);

/**
 * Unwrap a Result, throwing on failure.
 *
 * Intended for the presentation edge — notably TanStack Query, whose error
 * handling expects a rejected promise. Never call this inside domain code.
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.ok) return result.value;
  throw result.error;
};
