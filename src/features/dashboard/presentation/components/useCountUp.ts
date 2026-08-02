import { useEffect, useState } from 'react';

/**
 * Counts an integer up to `target` over `duration`.
 *
 * Separate from the arc animation, which runs on Reanimated's UI thread: text
 * cannot be driven from there without a `TextInput` trick that costs more in
 * complexity than it saves. Because the displayed value is a rounded 0–100
 * integer, this re-renders at most 100 times over the whole animation — well
 * under one per frame — so a plain rAF loop is the cheaper answer.
 *
 * Returns `target` immediately when `animate` is false, which is how reduced
 * motion is honoured.
 */
export function useCountUp(target: number, animate: boolean, duration = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Nothing to drive when motion is reduced — the returned value falls
    // straight through to `target` below, so no state write is needed here.
    if (!animate) return;

    let frame = 0;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: quick start, gentle settle. Matches the arc's easing.
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(target * eased));

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate, duration]);

  return animate ? value : target;
}
