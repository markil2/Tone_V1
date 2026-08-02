import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme';
import type { TypographyVariant } from '../tokens';

type ColorRole = 'default' | 'muted' | 'accent' | 'danger' | 'success' | 'inverted';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorRole;
  align?: 'left' | 'center' | 'right';
};

/**
 * The only text primitive in the app. Screens never import RN's Text directly,
 * which is what keeps the type scale and color roles enforceable.
 */
export function Text({
  variant = 'body',
  color = 'default',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  const colorValue = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
    success: theme.colors.success,
    inverted: theme.colors.textInverted,
  }[color];

  return (
    <RNText
      style={[theme.typography[variant], { color: colorValue, textAlign: align }, style]}
      {...rest}
    />
  );
}
