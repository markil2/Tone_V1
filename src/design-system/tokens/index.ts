/**
 * Design tokens — the single source of truth for every visual constant.
 *
 * Components consume tokens via `useTheme()`; no component should ever contain a
 * raw hex value or magic pixel number. When the brand changes, it changes here.
 */

/** Raw palette. Not consumed directly by components — see theme/ for semantic roles. */
export const palette = {
  // Neutrals, tuned for an OLED-friendly dark mode.
  black: '#000000',
  /** Deeper than ink900, for full-bleed dashboard backdrops. */
  abyss: '#05070C',
  ink900: '#0B0E14',
  ink800: '#12161F',
  ink700: '#1A1F2B',
  ink600: '#252B39',
  ink500: '#3A4256',
  slate400: '#6B7488',
  slate300: '#9AA2B4',
  slate200: '#C7CCD8',
  slate100: '#E6E9EF',
  slate50: '#F5F6FA',
  white: '#FFFFFF',

  // Brand: cyan, the accent the product is built around.
  brand600: '#06B6D4',
  brand500: '#22D3EE',
  brand400: '#67E8F9',

  /**
   * Translucent cyans for glows and fills. Kept here rather than computed at the
   * call site so opacity stays consistent across every glowing surface.
   */
  glow: 'rgba(34, 211, 238, 0.45)',
  glowSoft: 'rgba(34, 211, 238, 0.16)',
  glowFaint: 'rgba(34, 211, 238, 0.06)',

  // Domain accents — one per pillar, so charts stay legible and consistent.
  nutrition: '#FF8A4C',
  hydration: '#38BDF8',
  sleep: '#A78BFA',
  training: '#FB7185',
  recovery: '#34D399',

  // Status
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',
  info: '#60A5FA',

  /**
   * Muscle condition. Deliberately spread across hue AND lightness so the three
   * are still separable under the common forms of colour blindness — though the
   * UI never relies on that alone: every region also carries a text status.
   */
  muscleRecovered: '#5EEAD4',
  muscleBalanced: '#22D3EE',
  muscleFatigued: '#FB923C',
} as const;

/** 4pt spacing scale. Every gap, pad and margin comes from here. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Type scale. `variant` names are semantic, not sized — so a future rebrand can
 * change what `title` means without touching call sites.
 */
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  /** Tabular figures matter for metrics that update in place. */
  metric: { fontSize: 40, lineHeight: 44, fontWeight: '700' },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TypographyVariant = keyof typeof typography;
