import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Session storage adapters for supabase-js.
 *
 * Two are provided because the choice is a real security tradeoff, not a detail:
 *
 *   secureStorage  — Keychain (iOS) / EncryptedSharedPreferences (Android).
 *                    Encrypted at rest. Default.
 *   asyncStorage   — Plain unencrypted file on disk. Supabase's documented
 *                    React Native default, and fine for low-stakes apps.
 *
 * Swap the export at the bottom of this file to change which one the client uses.
 */

/* ------------------------------- AsyncStorage ------------------------------ */

/**
 * Unencrypted. A refresh token here is readable by any process with filesystem
 * access on a rooted or jailbroken device, and by anyone restoring an unencrypted
 * device backup.
 */
export const asyncStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

/* -------------------------------- SecureStore ------------------------------ */

/**
 * Encrypted, with transparent chunking.
 *
 * SecureStore rejects values over ~2 KB and a Supabase session with a fat JWT
 * routinely exceeds that, so values are split across numbered keys with a small
 * manifest recording the count.
 */
/**
 * Chunk size in CODE POINTS, not UTF-16 code units.
 *
 * Two bugs this avoids. Slicing by code unit can cut between the surrogate
 * halves of an astral character — a session whose user_metadata holds an emoji
 * then round-trips through the native layer as U+FFFD and fails JSON.parse on
 * the next cold start. And SecureStore's ~2048 limit is in BYTES, so a
 * character count only bounds it if you assume ASCII. 500 code points is safe
 * even at UTF-8's 4-bytes-per-code-point worst case (2000 bytes).
 */
const CHUNK_SIZE = 500;
const manifestKey = (key: string) => `${key}__chunks`;
const chunkKey = (key: string, i: number) => `${key}__${i}`;

/** Web has no SecureStore; fall back to localStorage so the web target works. */
const isWeb = Platform.OS === 'web';

async function clearChunks(key: string): Promise<void> {
  const manifest = await SecureStore.getItemAsync(manifestKey(key));
  if (!manifest) return;

  const count = Number.parseInt(manifest, 10);
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
  );
  await SecureStore.deleteItemAsync(manifestKey(key));
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;

    const manifest = await SecureStore.getItemAsync(manifestKey(key));
    if (!manifest) return null;

    const count = Number.parseInt(manifest, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
    );

    // A missing chunk means a partially written or partially evicted session.
    // Treat it as no session rather than handing supabase-js a corrupt string.
    if (chunks.some((chunk) => chunk === null)) {
      await clearChunks(key);
      return null;
    }

    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      globalThis.localStorage?.setItem(key, value);
      return;
    }

    await clearChunks(key);

    // Array.from iterates by code point, so a surrogate pair is one element and
    // can never be split across a chunk boundary.
    const codePoints = Array.from(value);
    const chunks: string[] = [];
    for (let i = 0; i < codePoints.length; i += CHUNK_SIZE) {
      chunks.push(codePoints.slice(i, i + CHUNK_SIZE).join(''));
    }

    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
    );
    // Written last, so a crash mid-write leaves no manifest and reads as "no session".
    await SecureStore.setItemAsync(manifestKey(key), String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await clearChunks(key);
  },
};

/**
 * THE ACTIVE ADAPTER — change this one line to switch.
 *
 * Defaults to secureStorage because this app stores health data, and an
 * unencrypted refresh token is a full account compromise rather than an
 * inconvenience. Change to `asyncStorage` if you'd rather follow Supabase's
 * documented default; everything else keeps working either way.
 */
export const sessionStorage = secureStorage;
