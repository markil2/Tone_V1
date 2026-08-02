import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/design-system';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
  /** 0–1, already clamped by the caller. */
  ratio: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Rendered inside the ring — a number, an icon, whatever fits. */
  children?: React.ReactNode;
};

/**
 * A circular progress ring, animated from empty on mount.
 *
 * The whole circumference is one stroke whose visible length is controlled by
 * `strokeDashoffset`, animated on the UI thread — so the fill stays smooth while
 * JavaScript re-renders the totals around it.
 *
 * Decorative by design: it is always accompanied by the number and status word
 * it represents, because a ring communicates only through shape and colour.
 */
export function ProgressRing({
  ratio,
  size = 52,
  strokeWidth = 4,
  color,
  children,
}: ProgressRingProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  const stroke = color ?? theme.colors.accent;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(reducedMotion ? ratio : 0);

  useEffect(() => {
    progress.value = reducedMotion
      ? ratio
      : withTiming(ratio, { duration: 850, easing: Easing.out(Easing.cubic) });
  }, [ratio, reducedMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // Start the fill at 12 o'clock rather than 3.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
