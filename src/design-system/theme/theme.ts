import { motion, palette, radius, spacing, typography } from '../tokens';

/**
 * Semantic color roles.
 *
 * Components reference roles (`colors.textMuted`), never palette entries
 * (`palette.slate300`). This indirection is what makes light/dark a data change
 * instead of a conditional in every component.
 */
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;

  text: string;
  textMuted: string;
  textInverted: string;

  accent: string;
  accentMuted: string;
  onAccent: string;

  danger: string;
  warning: string;
  success: string;
  info: string;

  /** Per-pillar accents, shared across both schemes for chart consistency. */
  domain: {
    nutrition: string;
    hydration: string;
    sleep: string;
    training: string;
    recovery: string;
  };

  /**
   * Dashboard-specific roles.
   *
   * Separate from the general roles because the dashboard is a single
   * full-bleed instrument panel, not a stack of cards: it needs a backdrop
   * darker than `background`, translucent glows, and body-map fills that have no
   * meaning anywhere else in the app.
   */
  dashboard: {
    backdrop: string;
    gridLine: string;
    glow: string;
    glowSoft: string;
    glowFaint: string;
    bodyFill: string;
    bodyStroke: string;
    bodyHighlight: string;
    muscle: {
      recovered: string;
      balanced: string;
      fatigued: string;
    };
  };
};

export type Theme = {
  name: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
};

const domain = {
  nutrition: palette.nutrition,
  hydration: palette.hydration,
  sleep: palette.sleep,
  training: palette.training,
  recovery: palette.recovery,
};

const muscle = {
  recovered: palette.muscleRecovered,
  balanced: palette.muscleBalanced,
  fatigued: palette.muscleFatigued,
};

const dashboardGlow = {
  glow: palette.glow,
  glowSoft: palette.glowSoft,
  glowFaint: palette.glowFaint,
  muscle,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: palette.ink900,
    surface: palette.ink800,
    surfaceElevated: palette.ink700,
    border: palette.ink600,

    text: palette.slate50,
    textMuted: palette.slate400,
    textInverted: palette.ink900,

    accent: palette.brand500,
    accentMuted: palette.ink700,
    onAccent: palette.ink900,

    danger: palette.danger,
    warning: palette.warning,
    success: palette.success,
    info: palette.info,

    domain,
    dashboard: {
      backdrop: palette.abyss,
      gridLine: 'rgba(103, 232, 249, 0.10)',
      bodyFill: 'rgba(18, 30, 44, 0.85)',
      bodyStroke: 'rgba(103, 232, 249, 0.28)',
      bodyHighlight: 'rgba(34, 211, 238, 0.55)',
      ...dashboardGlow,
    },
  },
  spacing,
  radius,
  typography,
  motion,
};

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: palette.white,
    surface: palette.slate50,
    surfaceElevated: palette.white,
    border: palette.slate100,

    text: palette.ink900,
    textMuted: palette.slate400,
    textInverted: palette.white,

    accent: palette.brand600,
    accentMuted: palette.slate100,
    onAccent: palette.white,

    danger: palette.danger,
    warning: palette.warning,
    success: palette.success,
    info: palette.info,

    domain,
    /**
     * Present for type completeness only — every dashboard surface renders under
     * `FixedThemeProvider`, which pins the dark theme regardless of preference.
     * Values here are the light-scheme equivalents in case that ever changes.
     */
    dashboard: {
      backdrop: palette.slate50,
      gridLine: 'rgba(6, 182, 212, 0.14)',
      bodyFill: 'rgba(6, 182, 212, 0.08)',
      bodyStroke: 'rgba(6, 182, 212, 0.40)',
      bodyHighlight: 'rgba(6, 182, 212, 0.65)',
      ...dashboardGlow,
    },
  },
  spacing,
  radius,
  typography,
  motion,
};
