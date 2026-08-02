import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import type { SpacingToken } from '../tokens';

export type CardProps = {
  children: ReactNode;
  padding?: SpacingToken;
  elevated?: boolean;
  /** Left accent bar, keyed to a tracking pillar. */
  accent?: keyof ReturnType<typeof useTheme>['colors']['domain'];
  style?: ViewStyle;
};

/**
 * Standard surface for grouped content. Every dashboard tile, log entry and
 * insight will be a Card, so it is worth having exactly one implementation.
 */
export function Card({ children, padding = 'lg', elevated = false, accent, style }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing[padding],
          overflow: 'hidden',
        },
        accent && {
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.domain[accent],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
