import { useWindowDimensions } from 'react-native';

/**
 * Layout breakpoints.
 *
 * Named after what the layout *does* at each width, not after devices — a
 * "tablet" breakpoint stops meaning anything the moment someone resizes a
 * browser window.
 *
 *   compact  — single column, controls collapse to a scroller, sheets slide up
 *   medium   — side rail appears, detail still stacks below the body
 *   wide     — three columns: rail | body | detail
 */
export const BREAKPOINTS = { medium: 600, wide: 900 } as const;

export type Breakpoint = 'compact' | 'medium' | 'wide';

export type Layout = {
  breakpoint: Breakpoint;
  width: number;
  height: number;
  /** True below `medium`. The common branch, so it earns a shorthand. */
  isCompact: boolean;
  /** True at `wide` and above — the only layout with a persistent side rail. */
  isWide: boolean;
};

export function useBreakpoint(): Layout {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= BREAKPOINTS.wide ? 'wide' : width >= BREAKPOINTS.medium ? 'medium' : 'compact';

  return {
    breakpoint,
    width,
    height,
    isCompact: breakpoint === 'compact',
    isWide: breakpoint === 'wide',
  };
}
