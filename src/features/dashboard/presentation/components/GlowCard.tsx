import type { ReactNode } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/design-system';

export type GlowCardProps = {
  children: ReactNode;
  /** Brightens the border and adds an outer glow — used for the active item. */
  active?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

/**
 * The dashboard's surface primitive.
 *
 * Not the design system's `Card`: that one is an opaque panel with a solid
 * border and an optional pillar accent, built for a light-or-dark app. The
 * dashboard's surfaces are translucent, sit on a near-black backdrop, and carry
 * a cyan rim that brightens on selection. Bending `Card` to do both would leave
 * neither convincing.
 */
export function GlowCard({ children, active = false, padding = 'lg', style }: GlowCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(11, 18, 32, 0.72)',
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: active ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
          padding: theme.spacing[padding === 'sm' ? 'md' : padding === 'md' ? 'lg' : 'xl'],
        },
        active ? glow(theme.colors.dashboard.glow) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Outer glow.
 *
 * Split by platform because the three renderers disagree: Android's `elevation`
 * ignores shadow colour entirely (so a cyan glow renders as a grey drop
 * shadow), while web needs a real `boxShadow` to spread. Only iOS honours the
 * classic shadow props the way this design wants.
 */
export function glow(color: string, radius = 16): ViewStyle {
  if (Platform.OS === 'web') {
    // RN Web passes unknown style keys through to CSS.
    return { boxShadow: `0 0 ${radius}px ${color}` } as ViewStyle;
  }

  if (Platform.OS === 'android') {
    return { elevation: 6 };
  }

  return {
    shadowColor: color,
    shadowOpacity: 1,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 0 },
  };
}
