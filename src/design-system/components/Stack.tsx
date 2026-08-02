import type { ReactNode } from 'react';
import { View, type AccessibilityProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import type { SpacingToken } from '../tokens';

/**
 * Accessibility props pass straight through to the underlying View.
 *
 * A Stack is frequently the natural grouping for a label — a metric and its
 * unit, a timeline dot and its caption — and without this every such case needs
 * a wrapper View that exists only to carry the label, which is noise.
 */
export type StackProps = AccessibilityProps & {
  children: ReactNode;
  direction?: 'row' | 'column';
  gap?: SpacingToken;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  flex?: number;
  wrap?: boolean;
  style?: ViewStyle;
};

/**
 * Layout primitive. Using `gap` from the spacing scale removes the usual sprawl
 * of one-off marginBottom values and keeps vertical rhythm consistent.
 */
export function Stack({
  children,
  direction = 'column',
  gap = 'none',
  align,
  justify,
  flex,
  wrap = false,
  style,
  ...accessibility
}: StackProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: direction,
          gap: theme.spacing[gap],
          alignItems: align,
          justifyContent: justify,
          flex,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...accessibility}
    >
      {children}
    </View>
  );
}
