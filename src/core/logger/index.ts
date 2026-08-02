/**
 * Thin logging seam.
 *
 * Everything logs through here so that swapping in Sentry (or scrubbing health
 * data before it leaves the device) is a one-file change rather than a
 * codebase-wide find-and-replace on console.*.
 */

type Context = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug(message: string, context?: Context): void {
    if (isDev) console.log(`[debug] ${message}`, context ?? '');
  },

  info(message: string, context?: Context): void {
    if (isDev) console.info(`[info] ${message}`, context ?? '');
  },

  warn(message: string, context?: Context): void {
    console.warn(`[warn] ${message}`, context ?? '');
  },

  /**
   * In production this should forward to crash reporting.
   * Never pass raw health records as context — aggregate or omit them.
   */
  error(message: string, error?: unknown, context?: Context): void {
    console.error(`[error] ${message}`, error ?? '', context ?? '');
  },
};
