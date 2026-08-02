import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Icon, Stack, Text, useTheme } from '@/design-system';
import { Panel } from '@/features/dashboard';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import {
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  searchKey,
  type Exercise,
  type MuscleGroup,
} from '../../domain/entities/exercise';
import { EXERCISE_CATALOGUE } from '../../data/exercise-catalogue';

/**
 * Search keys, built once for the whole catalogue.
 *
 * Module scope, not a hook: the catalogue is static, so rebuilding this per
 * mount would be pure waste on a screen that opens many times per session.
 */
const SEARCH_INDEX = new Map(EXERCISE_CATALOGUE.map((entry) => [entry.id, searchKey(entry)]));

function FilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Filter by ${label}`}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor:
          isActive || isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
        backgroundColor: isActive ? theme.colors.dashboard.glowFaint : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text variant="caption" color={isActive ? 'accent' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}

function ExerciseRow({ exercise, onAdd }: { exercise: Exercise; onAdd: () => void }) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onAdd}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`Add ${exercise.name}`}
      accessibilityHint={`${MUSCLE_GROUP_LABELS[exercise.primaryMuscle]}, ${
        EQUIPMENT_LABELS[exercise.equipment]
      }`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Stack gap="xs" flex={1}>
        <Text variant="callout">{exercise.name}</Text>
        <Text variant="caption" color="muted">
          {MUSCLE_GROUP_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
        </Text>
      </Stack>
      <Icon name="plus" size={18} color={theme.colors.accent} />
    </Pressable>
  );
}

/**
 * The exercise picker.
 *
 * Filtering runs over the bundled catalogue in memory, so results update on
 * every keystroke with no spinner and no network — which is the only acceptable
 * behaviour for something used mid-set.
 */
export function ExerciseLibrary({
  onAdd,
  onClose,
}: {
  onAdd: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return EXERCISE_CATALOGUE.filter((exercise) => {
      if (muscle !== null) {
        const matchesMuscle =
          exercise.primaryMuscle === muscle || exercise.secondaryMuscles.includes(muscle);
        if (!matchesMuscle) return false;
      }

      if (needle.length === 0) return true;
      return (SEARCH_INDEX.get(exercise.id) ?? '').includes(needle);
    }).sort((a, b) => {
      // Compounds first — they are what a session is built around.
      if (a.isCompound !== b.isCompound) return a.isCompound ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [query, muscle]);

  return (
    <Panel title="Add exercise" subtitle={`${results.length} exercises`} onClose={onClose}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.dashboard.bodyStroke,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <Icon name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel="Search exercises"
          autoCorrect={false}
          returnKeyType="search"
          style={{
            flex: 1,
            paddingVertical: theme.spacing.md,
            color: theme.colors.text,
            ...theme.typography.body,
          }}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
      >
        <FilterChip label="All" isActive={muscle === null} onPress={() => setMuscle(null)} />
        {MUSCLE_GROUPS.map((group) => (
          <FilterChip
            key={group}
            label={MUSCLE_GROUP_LABELS[group]}
            isActive={muscle === group}
            onPress={() => setMuscle(muscle === group ? null : group)}
          />
        ))}
      </ScrollView>

      {results.length === 0 ? (
        <Stack gap="xs" style={{ paddingVertical: theme.spacing.xl }}>
          <Text variant="callout" align="center">
            No exercises match “{query}”
          </Text>
          <Text variant="caption" color="muted" align="center">
            Try a shorter search, or clear the muscle filter.
          </Text>
        </Stack>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(exercise) => exercise.id}
          renderItem={({ item }) => <ExerciseRow exercise={item} onAdd={() => onAdd(item)} />}
          // The Panel already scrolls; nesting a second scroller would fight it.
          scrollEnabled={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          )}
        />
      )}
    </Panel>
  );
}
