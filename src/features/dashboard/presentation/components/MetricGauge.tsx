import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Stack, Text, useTheme } from '@/design-system';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { scoreBand } from '../../domain/entities/dashboard';
import { useCountUp } from './useCountUp';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type MetricGaugeProps = {
  label: string;
  value: number;
  onPress: () => void;
  size?: number;
};

const STROKE = 7;
/** Separator count across the arc. Tuned to read as segments, not as a dotted line. */
const SEGMENTS = 22;
const SEPARATOR_WIDTH = 4;

/**
 * A semicircular, segmented gauge.
 *
 * Built from three stacked strokes rather than N individually drawn segments:
 *
 *   1. the muted track
 *   2. the cyan value arc, revealed by animating `strokeDashoffset`
 *   3. a backdrop-coloured dashed stroke on top, which punches the separators out
 *      of both layers below
 *
 * Drawing 22 discrete arcs instead would mean recomputing which ones are lit on
 * every frame — impossible to run on the UI thread, and visibly steppy. This way
 * the fill is continuous and smooth while still looking segmented.
 */
export function MetricGauge({ label, value, onPress, size = 128 }: MetricGaugeProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const { isFocused, focusProps } = useFocusRing();

  const radius = (size - STROKE) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const arcLength = Math.PI * radius;

  // Semicircle, drawn left → right over the top.
  const arc = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
    centerX + radius
  } ${centerY}`;

  const progress = useSharedValue(reducedMotion ? value : 0);

  useEffect(() => {
    progress.value = reducedMotion
      ? value
      : withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [value, reducedMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: arcLength * (1 - progress.value / 100),
  }));

  const displayed = useCountUp(value, !reducedMotion);
  const band = scoreBand(value);

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value} percent, ${band}`}
      accessibilityHint="Opens the details for this metric"
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={({ pressed }) => ({
        alignItems: 'center',
        gap: theme.spacing.xs,
        opacity: pressed ? 0.75 : 1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : 'transparent',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      })}
    >
      <Text
        variant="caption"
        color="muted"
        align="center"
        style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}
      >
        {label}
      </Text>

      <View style={{ width: size, height: size / 2 + STROKE }}>
        <Svg width={size} height={size / 2 + STROKE} aria-hidden>
          <Path
            d={arc}
            stroke={theme.colors.border}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            fill="none"
          />
          <AnimatedPath
            d={arc}
            stroke={theme.colors.accent}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            fill="none"
            strokeDasharray={[arcLength, arcLength]}
            animatedProps={animatedProps}
          />
          {/* Separators, painted in the backdrop colour on top of both arcs. */}
          <Path
            d={arc}
            stroke={theme.colors.dashboard.backdrop}
            strokeWidth={STROKE + 2}
            fill="none"
            strokeDasharray={[
              SEPARATOR_WIDTH,
              arcLength / SEGMENTS - SEPARATOR_WIDTH,
            ]}
          />
        </Svg>

        <Stack
          direction="row"
          align="baseline"
          justify="center"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>
            {displayed}
          </Text>
          <Text variant="caption" color="muted">
            %
          </Text>
        </Stack>
      </View>

      <Text variant="caption" align="center">
        {band}
      </Text>
    </Pressable>
  );
}
