import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics wrapper.
 *
 * Two reasons this exists rather than calling expo-haptics directly:
 * web has no haptics API (the calls reject), and a user-level "reduce haptics"
 * setting will need exactly one place to switch off.
 *
 * Every call is fire-and-forget — a failed haptic must never break an interaction.
 */
const enabled = Platform.OS !== 'web';

export const haptics = {
  /** Ruler tick, segment change — the lightest possible confirmation. */
  tick(): void {
    if (enabled) void Haptics.selectionAsync().catch(() => {});
  },

  /** A choice was committed. */
  select(): void {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  /** Flow completed, goal hit. */
  success(): void {
    if (enabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  },

  error(): void {
    if (enabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  },
};
