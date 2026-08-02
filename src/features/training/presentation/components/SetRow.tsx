import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Pressable, TextInput, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon, Stack, Text, useTheme } from '@/design-system';
import { haptics } from '@/shared/haptics';
import type { WorkoutSet } from '../../domain/entities/workout';

/** Past this much horizontal travel, releasing completes the set. */
const COMPLETE_THRESHOLD = 96;
/** Beyond this the row stops following the finger, so it can't be dragged away. */
const MAX_TRAVEL = 140;

export type SetRowProps = {
  set: WorkoutSet;
  index: number;
  unit: 'kg' | 'lb';
  /** Display weight, already converted out of the stored kilograms. */
  displayWeight: string;
  canCopyPrevious: boolean;
  onChangeWeight: (text: string) => void;
  onChangeReps: (text: string) => void;
  onToggleComplete: () => void;
  onCopyPrevious: () => void;
};

function NumberCell({
  value,
  placeholder,
  label,
  onChangeText,
  editable,
}: {
  value: string;
  placeholder: string;
  label: string;
  onChangeText: (text: string) => void;
  editable: boolean;
}) {
  const theme = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textMuted}
      accessibilityLabel={label}
      editable={editable}
      keyboardType="decimal-pad"
      selectTextOnFocus
      style={{
        flex: 1,
        textAlign: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.dashboard.bodyStroke,
        color: theme.colors.text,
        ...theme.typography.callout,
        fontVariant: ['tabular-nums'],
      }}
    />
  );
}

/**
 * One set, completed by swiping right.
 *
 * The gesture is the primary action because it is the one performed most — often
 * dozens of times per session, frequently one-handed with a bar still racked.
 * The checkmark button does the same thing for anyone who cannot swipe, which is
 * why the row is not gesture-only.
 *
 * The translation is driven on the UI thread so it tracks the finger even while
 * JavaScript is busy re-rendering the metrics header above it.
 */
export function SetRow({
  set,
  index,
  unit,
  displayWeight,
  canCopyPrevious,
  onChangeWeight,
  onChangeReps,
  onToggleComplete,
  onCopyPrevious,
}: SetRowProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);

  const commit = () => {
    haptics.success();
    onToggleComplete();
  };

  const pan = Gesture.Pan()
    // Vertical scrolling must still win; only near-horizontal drags activate.
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .enabled(!set.isCompleted)
    .onUpdate((event) => {
      translateX.value = Math.max(0, Math.min(event.translationX, MAX_TRAVEL));
    })
    .onEnd(() => {
      if (translateX.value >= COMPLETE_THRESHOLD) {
        runOnJS(commit)();
      }
      translateX.value = reducedMotion
        ? 0
        : withSpring(0, { damping: 20, stiffness: 220, mass: 0.6 });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, COMPLETE_THRESHOLD], [0, 1], 'clamp'),
  }));

  const completedStyle = useAnimatedStyle(() => ({
    backgroundColor: set.isCompleted
      ? theme.colors.dashboard.glowFaint
      : 'transparent',
    opacity: reducedMotion ? 1 : withTiming(set.isCompleted ? 1 : 0.95, { duration: 160 }),
  }));

  return (
    <View style={{ overflow: 'hidden', borderRadius: theme.radius.md }}>
      {/* Revealed behind the row as it slides. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            justifyContent: 'center',
            paddingLeft: theme.spacing.lg,
            backgroundColor: theme.colors.dashboard.glowSoft,
          },
          trackStyle,
        ]}
        pointerEvents="none"
      >
        <Icon name="check" size={20} color={theme.colors.accent} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[rowStyle, completedStyle]}>
          <Stack
            direction="row"
            align="center"
            gap="sm"
            style={{ paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm }}
          >
            <Text
              variant="caption"
              color={set.isCompleted ? 'accent' : 'muted'}
              style={{ width: 24, textAlign: 'center' }}
            >
              {set.kind === 'warmup' ? 'W' : index + 1}
            </Text>

            <NumberCell
              value={displayWeight}
              placeholder="0"
              label={`Set ${index + 1} weight in ${unit}`}
              onChangeText={onChangeWeight}
              editable={!set.isCompleted}
            />

            <NumberCell
              value={set.reps === null ? '' : String(set.reps)}
              placeholder="0"
              label={`Set ${index + 1} reps`}
              onChangeText={onChangeReps}
              editable={!set.isCompleted}
            />

            <Pressable
              onPress={onCopyPrevious}
              disabled={!canCopyPrevious || set.isCompleted}
              accessibilityRole="button"
              accessibilityLabel={`Copy previous set into set ${index + 1}`}
              hitSlop={8}
              style={{ opacity: canCopyPrevious && !set.isCompleted ? 1 : 0.25 }}
            >
              <Icon name="copy" size={16} color={theme.colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={onToggleComplete}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: set.isCompleted }}
              accessibilityLabel={`Set ${index + 1} complete`}
              accessibilityHint="Or swipe the row right"
              hitSlop={8}
              style={{
                width: 30,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radius.full,
                borderWidth: 1,
                borderColor: set.isCompleted ? theme.colors.accent : theme.colors.border,
              }}
            >
              <Icon
                name="check"
                size={15}
                color={set.isCompleted ? theme.colors.accent : theme.colors.textMuted}
              />
            </Pressable>
          </Stack>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
