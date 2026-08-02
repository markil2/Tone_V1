import { ScrollView, Pressable } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { MUSCLE_STATUS_LABELS, type MuscleData } from '../../../domain/entities/dashboard';
import type { MuscleId } from '../../../domain/entities/muscles';

/** One chip. Its own component so the focus-ring hook is not called in a loop. */
function Chip({
  muscle,
  isSelected,
  onSelect,
}: {
  muscle: MuscleData;
  isSelected: boolean;
  onSelect: (id: MuscleId) => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={() => onSelect(muscle.id)}
      {...focusProps}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${muscle.name}, ${
        MUSCLE_STATUS_LABELS[muscle.status]
      }, ${muscle.recovery} percent recovered`}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.md,
        // 40pt tall: comfortably over the 44pt touch target once the horizontal
        // padding and text are counted.
        paddingVertical: theme.spacing.sm + 2,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor:
          isSelected || isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
        backgroundColor: isSelected ? theme.colors.dashboard.glowFaint : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text variant="caption" color={isSelected ? 'accent' : 'muted'}>
        {muscle.name}
      </Text>
    </Pressable>
  );
}

/**
 * A selectable chip per muscle, mirroring the body map.
 *
 * This is the accessible path to the same selection, not a decorative extra.
 * SVG `Path` elements take press handlers, but keyboard focus inside an `<svg>`
 * is unreliable across React Native Web and the native renderers — so a keyboard
 * or switch-control user gets ordinary `Pressable`s with real focus rings here,
 * driving exactly the same state as a tap on the figure.
 */
export function MuscleChips({
  muscles,
  selectedMuscleId,
  onSelect,
}: {
  muscles: MuscleData[];
  selectedMuscleId: MuscleId | null;
  onSelect: (id: MuscleId) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xs }}
    >
      {muscles.map((muscle) => (
        <Chip
          key={muscle.id}
          muscle={muscle}
          isSelected={muscle.id === selectedMuscleId}
          onSelect={onSelect}
        />
      ))}
    </ScrollView>
  );
}
