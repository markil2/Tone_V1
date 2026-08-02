import { useCallback, useState } from 'react';

/**
 * Tracks keyboard/assistive focus on a pressable.
 *
 * `Pressable`'s style callback only reports `pressed` — there is no `focused`
 * flag — so a visible focus ring has to come from the focus events instead.
 * Wrapping it here keeps every dashboard control's focus treatment identical,
 * and means the fix lands in one place if React Native ever exposes it directly.
 *
 * Spread `focusProps` onto the pressable and use `isFocused` in its style.
 */
export function useFocusRing() {
  const [isFocused, setFocused] = useState(false);

  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);

  return { isFocused, focusProps: { onFocus, onBlur } } as const;
}
