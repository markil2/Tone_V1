import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const HEIGHT: Record<Size, number> = { sm: 36, md: 48, lg: 56 };
const HORIZONTAL_PADDING: Record<Size, number> = { sm: 12, md: 18, lg: 24 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useTheme();
  // A button in flight must not be pressable again — this is the guard that
  // prevents duplicate writes on slow connections.
  const isInactive = disabled || loading;

  const surface: Record<Variant, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.accent,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    secondary: {
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' },
    danger: {
      backgroundColor: theme.colors.danger,
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
  };

  const labelColor = {
    primary: 'inverted',
    secondary: 'default',
    ghost: 'accent',
    danger: 'inverted',
  } as const;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      /**
       * Named explicitly rather than relying on the child Text.
       *
       * React Native Web does not derive an accessible name from descendants of
       * a Pressable, so without this every Button reached the DOM unnamed — and
       * while loading, when the label is replaced by a spinner, there is no
       * child to derive one from on any platform.
       */
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: HEIGHT[size],
          minWidth: 0,
          flexShrink: 1,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: HORIZONTAL_PADDING[size],
          paddingVertical: theme.spacing.xs,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isInactive ? 0.5 : pressed ? 0.78 : 1,
          transform: [{ scale: pressed && !isInactive ? 0.985 : 1 }],
        },
        surface[variant],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.onAccent : theme.colors.text}
        />
      ) : (
        <View style={{ maxWidth: '100%', minWidth: 0 }}>
          <Text
            variant="callout"
            color={labelColor[variant]}
            numberOfLines={1}
            style={{ textAlign: 'center', flexShrink: 1 }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
