import { Pressable, View } from 'react-native';

import { Icon, Stack, Text, useTheme, type IconName } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import {
  MEAL_SLOT_LABELS,
  mealTotals,
  type Meal,
  type MealSlot,
} from '../../domain/entities/nutrition';
import { summarizeMeal } from '../../domain/use-cases/meal-summary';

/** Time-of-day glyphs, standing in for the reference's food photography. */
const SLOT_ICONS: Record<MealSlot, IconName> = {
  breakfast: 'sun',
  lunch: 'sun',
  dinner: 'sunset',
  snack: 'moon',
};

function MealRow({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();
  const summary = summarizeMeal(meal);
  const totals = mealTotals(meal);

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`${MEAL_SLOT_LABELS[meal.slot]}, ${summary.headline}. ${summary.detail}`}
      accessibilityHint="Opens meal details"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.dashboard.bodyStroke,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={SLOT_ICONS[meal.slot]} size={20} color={theme.colors.textMuted} />
      </View>

      <Stack gap="xs" flex={1}>
        <Text variant="callout">{MEAL_SLOT_LABELS[meal.slot]}</Text>
        {totals.calories > 0 ? (
          <Text variant="caption" color="muted" style={{ fontVariant: ['tabular-nums'] }}>
            {Math.round(totals.calories)} kcal
          </Text>
        ) : null}
      </Stack>

      <Stack gap="xs" flex={1.2}>
        <Text variant="caption" color={summary.isPositive ? 'accent' : 'default'}>
          {summary.headline}
        </Text>
        <Text variant="caption" color="muted">
          {summary.detail}
        </Text>
      </Stack>

      <Icon name="chevronRight" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export function MealCard({
  meals,
  onSelect,
}: {
  meals: Meal[];
  onSelect: (meal: Meal) => void;
}) {
  const theme = useTheme();

  return (
    <GlowCard>
      <Stack gap="sm">
        <Text variant="heading" style={{ marginBottom: theme.spacing.xs }}>
          Today’s meals
        </Text>

        {meals.map((meal, index) => (
          <View key={meal.id}>
            {index > 0 ? (
              <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            ) : null}
            <MealRow meal={meal} onPress={() => onSelect(meal)} />
          </View>
        ))}
      </Stack>
    </GlowCard>
  );
}
