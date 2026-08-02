import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { logger } from '@/core/logger';

/**
 * Device-local persistence for the dashboard.
 *
 * Scope is deliberately narrow. Anything the server owns — onboarding
 * completion, profile answers, targets — stays on the server; duplicating it
 * here is the classic source of stale-data bugs the architecture doc warns
 * about. What lives here is the mock health snapshot (which has no home yet) and
 * device-local preferences, both of which are worthless on another device.
 *
 * AsyncStorage rather than SecureStore: none of this is sensitive enough to
 * justify the 2 KB chunking dance, and a snapshot of mock numbers is not a
 * credential.
 */

const NAMESPACE = 'pulse.dashboard';

export const storageKeys = {
  metrics: (userId: string) => `${NAMESPACE}.metrics.${userId}`,
  preferences: (userId: string) => `${NAMESPACE}.preferences.${userId}`,
} as const;

/**
 * Read and parse a JSON value.
 *
 * A parse failure resolves to `null`, not an error: the only way to get one is a
 * partially written or version-skewed record, and treating that as "nothing
 * stored" lets the caller regenerate rather than trapping the user on an error
 * screen they cannot clear.
 */
export async function readJson<T>(key: string): Promise<Result<T | null, AppError>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return ok(null);

    try {
      return ok(JSON.parse(raw) as T);
    } catch (cause) {
      logger.error('Discarding unreadable stored value', { key, cause });
      await AsyncStorage.removeItem(key);
      return ok(null);
    }
  } catch (cause) {
    return err(
      new AppError({
        code: 'unknown',
        message: `Failed to read ${key}`,
        userMessage: "We couldn't load your saved dashboard.",
        cause,
      }),
    );
  }
}

export async function writeJson<T>(key: string, value: T): Promise<Result<void, AppError>> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return ok(undefined);
  } catch (cause) {
    return err(
      new AppError({
        code: 'unknown',
        message: `Failed to write ${key}`,
        userMessage: "We couldn't save your dashboard.",
        cause,
      }),
    );
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (cause) {
    // Best-effort: failing to clear a cache is never worth surfacing.
    logger.error('Failed to clear stored value', { key, cause });
  }
}
