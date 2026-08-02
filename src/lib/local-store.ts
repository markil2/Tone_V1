import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';

/**
 * Device-local persistence, used while the app runs without a backend.
 *
 * This exists so the whole product — survey, dashboard, nutrition, training —
 * works with no Supabase project and no sign-in. It is the storage half of that;
 * the repositories in each feature's `data/` folder are the other half.
 *
 * Deliberately in `src/lib` rather than inside a feature: three separate
 * features' adapters need it, and reaching across features for it would violate
 * the import boundary ESLint enforces.
 *
 * Not a general-purpose cache. When a real backend is connected, the container
 * swaps back to the Supabase repositories and everything here becomes dead.
 */

const NAMESPACE = 'pulse.local';

export const localKeys = {
  userId: `${NAMESPACE}.userId`,
  profile: (userId: string) => `${NAMESPACE}.profile.${userId}`,
  targets: (userId: string) => `${NAMESPACE}.targets.${userId}`,
  firstWorkoutCompleted: (userId: string) => `${NAMESPACE}.firstWorkoutCompleted.${userId}`,
} as const;

/**
 * Read and parse a JSON value.
 *
 * A parse failure resolves to `null` rather than an error: the only way to get
 * one is a partially written or version-skewed record, and regenerating is
 * always better than trapping the user on a screen they cannot clear.
 */
export async function readJson<T>(key: string): Promise<Result<T | null, AppError>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return ok(null);

    try {
      return ok(JSON.parse(raw) as T);
    } catch (cause) {
      logger.error('Discarding unreadable local record', { key, cause });
      await AsyncStorage.removeItem(key);
      return ok(null);
    }
  } catch (cause) {
    return err(
      new AppError({
        code: 'unknown',
        message: `Failed to read ${key}`,
        userMessage: "We couldn't load your saved data.",
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
        userMessage: "We couldn't save your changes.",
        cause,
      }),
    );
  }
}

/* -------------------------------- identity -------------------------------- */

/**
 * The device's stand-in user id.
 *
 * Every user-scoped key in the app — profile, targets, dashboard snapshot,
 * nutrition day — is namespaced by a user id. With no auth there is nobody to
 * supply one, so the device mints a stable id on first launch and reuses it.
 *
 * Cached in a module variable because it is read on nearly every query and the
 * value cannot change without an explicit reset.
 */
let cachedUserId: string | null = null;

function mintUserId(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getLocalUserId(): Promise<string> {
  if (cachedUserId !== null) return cachedUserId;

  try {
    const stored = await AsyncStorage.getItem(localKeys.userId);
    if (stored !== null) {
      cachedUserId = stored;
      return stored;
    }
  } catch (cause) {
    // A device that cannot read storage still needs to run; it just will not
    // remember anything between launches.
    logger.error('Could not read local user id', { cause });
  }

  const created = mintUserId();
  cachedUserId = created;

  try {
    await AsyncStorage.setItem(localKeys.userId, created);
  } catch (cause) {
    logger.error('Could not persist local user id', { cause });
  }

  return created;
}

/** Wipes this device's data and mints a new identity. Powers "Reset app data". */
export async function resetLocalUser(): Promise<void> {
  const current = cachedUserId ?? (await getLocalUserId());

  try {
    await AsyncStorage.multiRemove([
      localKeys.userId,
      localKeys.profile(current),
      localKeys.targets(current),
      localKeys.firstWorkoutCompleted(current),
    ]);
  } catch (cause) {
    logger.error('Could not clear local user data', { cause });
  }

  cachedUserId = null;
}
