import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button, Stack, Text, useTheme } from '@/design-system';
import { GlowCard, Panel, PanelRow } from '@/features/dashboard';
import {
  createId,
  MEAL_SLOT_LABELS,
  mealTotals,
  type Food,
  type MacroTargets,
  type Meal,
  type Micronutrient,
  type Supplement,
} from '../../domain/entities/nutrition';
import { generateGuidance, type Guidance } from '../../domain/use-cases/generate-guidance';
import { progressRatio } from '../../domain/use-cases/progress-status';
import { ProgressRing } from './ProgressRing';
import { SupplementRow } from './SupplementsCard';

/* --------------------------- nutrition overview ---------------------------- */

/** A bar per day. Real history needs storage across days, which does not exist yet. */
function WeekChart({ values, goal }: { values: number[]; goal: number }) {
  const theme = useTheme();
  const max = Math.max(goal, ...values, 1);

  return (
    <Stack direction="row" gap="xs" align="flex-end" style={{ height: 96 }}>
      {values.map((value, index) => (
        <Stack key={index} gap="xs" align="center" flex={1}>
          <View
            style={{
              width: '100%',
              height: `${(value / max) * 100}%`,
              minHeight: 3,
              borderRadius: theme.radius.sm,
              backgroundColor:
                value === 0 ? theme.colors.border : theme.colors.accent,
              opacity: value === 0 ? 0.4 : 0.55 + (value / max) * 0.45,
            }}
          />
          <Text variant="caption" color="muted">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}

export function NutritionOverviewModal({
  consumed,
  targets,
  onClose,
}: {
  consumed: MacroTargets;
  targets: MacroTargets;
  onClose: () => void;
}) {
  // Only today is real. The rest of the week is zero rather than invented,
  // because a fabricated trend is the one thing a trends view must never show.
  const week = [0, 0, 0, 0, 0, 0, Math.round(consumed.calories)];
  const loggedDays = week.filter((value) => value > 0).length;

  return (
    <Panel title="Nutrition overview" subtitle="Today and this week" onClose={onClose}>
      <GlowCard padding="md" active>
        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
            TODAY
          </Text>
          <Stack direction="row" align="baseline" gap="xs">
            <Text variant="metric" style={{ fontVariant: ['tabular-nums'] }}>
              {Math.round(consumed.calories).toLocaleString()}
            </Text>
            <Text variant="body" color="muted">
              / {targets.calories.toLocaleString()} kcal
            </Text>
          </Stack>
        </Stack>
      </GlowCard>

      <Stack gap="md">
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          CALORIE HISTORY
        </Text>
        <WeekChart values={week} goal={targets.calories} />
        <Text variant="caption" color="muted">
          {loggedDays === 1
            ? 'Only today has been logged. Bars fill in as you log each day.'
            : `${loggedDays} days logged this week.`}
        </Text>
      </Stack>

      <Stack>
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          MACRO BREAKDOWN
        </Text>
        <PanelRow
          label="Protein"
          value={`${Math.round(consumed.proteinG)} / ${targets.proteinG} g`}
        />
        <PanelRow label="Carbs" value={`${Math.round(consumed.carbsG)} / ${targets.carbsG} g`} />
        <PanelRow label="Fat" value={`${Math.round(consumed.fatG)} / ${targets.fatG} g`} />
      </Stack>

      <Stack>
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          WEEKLY AVERAGES
        </Text>
        <PanelRow
          label="Average calories"
          value={
            loggedDays > 0
              ? `${Math.round(week.reduce((a, b) => a + b, 0) / loggedDays).toLocaleString()} kcal`
              : '—'
          }
          hint="Averaged over days with food logged, not over all seven."
        />
      </Stack>
    </Panel>
  );
}

/* ------------------------------ meal details ------------------------------- */

export function MealDetailsModal({
  meal,
  onClose,
  onAddFood,
  onRemoveFood,
  onClear,
  onDuplicate,
  onRename,
}: {
  meal: Meal;
  onClose: () => void;
  onAddFood: (food: Food) => void;
  onRemoveFood: (foodId: string) => void;
  onClear: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
}) {
  const theme = useTheme();
  const totals = mealTotals(meal);

  const [isAdding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const numeric = (text: string) => {
    const value = Number.parseFloat(text.replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  };

  const canSave = name.trim().length > 0 && numeric(calories) > 0;

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.dashboard.bodyStroke,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    ...theme.typography.body,
  };

  const submit = () => {
    onAddFood({
      id: createId('food'),
      name: name.trim(),
      serving: '1 serving',
      quantity: 1,
      calories: numeric(calories),
      proteinG: numeric(protein),
      carbsG: numeric(carbs),
      fatG: numeric(fat),
      fiberG: 0,
      isPlantWhole: false,
    });

    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setAdding(false);
  };

  return (
    <Panel
      title={MEAL_SLOT_LABELS[meal.slot]}
      subtitle={`${Math.round(totals.calories)} kcal · ${meal.foods.length} item${
        meal.foods.length === 1 ? '' : 's'
      }`}
      onClose={onClose}
    >
      <Stack gap="sm">
        <Text variant="caption" color="muted">
          Meal name
        </Text>
        <TextInput
          value={meal.name}
          onChangeText={onRename}
          accessibilityLabel="Meal name"
          placeholderTextColor={theme.colors.textMuted}
          style={inputStyle}
        />
      </Stack>

      <Stack>
        <PanelRow label="Calories" value={`${Math.round(totals.calories)} kcal`} />
        <PanelRow label="Protein" value={`${Math.round(totals.proteinG)} g`} />
        <PanelRow label="Carbs" value={`${Math.round(totals.carbsG)} g`} />
        <PanelRow label="Fat" value={`${Math.round(totals.fatG)} g`} />
      </Stack>

      <Stack gap="sm">
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          FOODS
        </Text>

        {meal.foods.length === 0 ? (
          <Text variant="caption" color="muted">
            Nothing logged for this meal yet.
          </Text>
        ) : (
          meal.foods.map((food) => (
            <GlowCard key={food.id} padding="sm">
              <Stack direction="row" gap="md" align="center">
                <Stack gap="xs" flex={1}>
                  <Text variant="callout">{food.name}</Text>
                  <Text variant="caption" color="muted">
                    {food.serving} · {Math.round(food.calories * food.quantity)} kcal ·{' '}
                    {Math.round(food.proteinG * food.quantity)}p /{' '}
                    {Math.round(food.carbsG * food.quantity)}c /{' '}
                    {Math.round(food.fatG * food.quantity)}f
                  </Text>
                </Stack>
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onPress={() => onRemoveFood(food.id)}
                />
              </Stack>
            </GlowCard>
          ))
        )}
      </Stack>

      {isAdding ? (
        <GlowCard padding="md">
          <Stack gap="sm">
            <Text variant="callout">Add a food</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Food name"
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Food name"
              style={inputStyle}
            />
            <TextInput
              value={calories}
              onChangeText={setCalories}
              placeholder="Calories"
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Calories"
              keyboardType="decimal-pad"
              style={inputStyle}
            />
            <Stack direction="row" gap="sm">
              <TextInput
                value={protein}
                onChangeText={setProtein}
                placeholder="P (g)"
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel="Protein grams"
                keyboardType="decimal-pad"
                style={{ ...inputStyle, flex: 1 }}
              />
              <TextInput
                value={carbs}
                onChangeText={setCarbs}
                placeholder="C (g)"
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel="Carb grams"
                keyboardType="decimal-pad"
                style={{ ...inputStyle, flex: 1 }}
              />
              <TextInput
                value={fat}
                onChangeText={setFat}
                placeholder="F (g)"
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel="Fat grams"
                keyboardType="decimal-pad"
                style={{ ...inputStyle, flex: 1 }}
              />
            </Stack>
            <Button label="Save food" onPress={submit} disabled={!canSave} />
            <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} />
          </Stack>
        </GlowCard>
      ) : (
        <Button label="Add food" onPress={() => setAdding(true)} />
      )}

      <Stack direction="row" gap="sm">
        <Button
          label="Duplicate"
          variant="secondary"
          size="sm"
          onPress={onDuplicate}
          style={{ flex: 1 }}
        />
        <Button
          label="Clear meal"
          variant="secondary"
          size="sm"
          onPress={onClear}
          style={{ flex: 1 }}
        />
      </Stack>
    </Panel>
  );
}

/* --------------------------- micronutrient detail -------------------------- */

export function MicronutrientModal({
  micro,
  onClose,
}: {
  micro: Micronutrient;
  onClose: () => void;
}) {
  const theme = useTheme();
  const ratio = progressRatio(micro.consumed, micro.goal);

  return (
    <Panel title={micro.name} subtitle={micro.why} onClose={onClose}>
      <Stack direction="row" gap="lg" align="center">
        <ProgressRing ratio={ratio} size={92} strokeWidth={6}>
          <Text variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
            {Math.round(ratio * 100)}%
          </Text>
        </ProgressRing>

        <Stack gap="xs" flex={1}>
          <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>
            {micro.consumed}
            <Text variant="body" color="muted">
              {` / ${micro.goal} ${micro.unit}`}
            </Text>
          </Text>
          <Text variant="caption" color="muted">
            Daily goal
          </Text>
        </Stack>
      </Stack>

      <Stack gap="sm">
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
          FOODS RICH IN {micro.name.toUpperCase()}
        </Text>
        {micro.sources.map((source) => (
          <View
            key={source}
            style={{
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text variant="callout" style={{ textTransform: 'capitalize' }}>
              {source}
            </Text>
          </View>
        ))}
      </Stack>

      <Text variant="caption" color="muted">
        General nutrition information, not medical advice. Targets follow common adult
        reference intakes and are not personalised to any condition.
      </Text>
    </Panel>
  );
}

/* ------------------------------- supplements ------------------------------- */

export function SupplementsModal({
  supplements,
  onClose,
  onToggle,
  onRemove,
  onAdd,
}: {
  supplements: Supplement[];
  onClose: () => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (supplement: Omit<Supplement, 'id'>) => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.dashboard.bodyStroke,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    ...theme.typography.body,
  };

  const submit = () => {
    onAdd({ name: name.trim(), dose: dose.trim() || '—', takenAt: null, notes: notes.trim() || null });
    setName('');
    setDose('');
    setNotes('');
  };

  return (
    <Panel title="Supplements" subtitle="Today’s log" onClose={onClose}>
      <Stack gap="lg">
        {supplements.length === 0 ? (
          <Text variant="caption" color="muted">
            Nothing added yet.
          </Text>
        ) : (
          supplements.map((supplement) => (
            <SupplementRow
              key={supplement.id}
              supplement={supplement}
              onToggle={() => onToggle(supplement.id)}
              onRemove={() => onRemove(supplement.id)}
            />
          ))
        )}
      </Stack>

      <GlowCard padding="md">
        <Stack gap="sm">
          <Text variant="callout">Add a supplement</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel="Supplement name"
            style={inputStyle}
          />
          <TextInput
            value={dose}
            onChangeText={setDose}
            placeholder="Dose, e.g. 1000 IU"
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel="Dose"
            style={inputStyle}
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel="Notes"
            style={inputStyle}
          />
          <Button label="Add" onPress={submit} disabled={name.trim().length === 0} />
        </Stack>
      </GlowCard>

      <Text variant="caption" color="muted">
        A log only. Pulse does not recommend supplements or doses — follow your clinician’s
        plan.
      </Text>
    </Panel>
  );
}

/* -------------------------------- guidance --------------------------------- */

export function GuidanceModal({
  guidance,
  onClose,
}: {
  guidance: Guidance[];
  onClose: () => void;
}) {
  return (
    <Panel title="AI guidance" subtitle="Generated from today’s numbers" onClose={onClose}>
      {guidance.map((entry) => (
        <GlowCard key={entry.id} padding="md">
          <Text variant="body">{entry.message}</Text>
        </GlowCard>
      ))}

      <Text variant="caption" color="muted">
        Produced on your device by a rule engine over your logged intake, hydration and
        recovery — not a live model, and not medical advice.
      </Text>
    </Panel>
  );
}

/* ------------------------------ logging methods ---------------------------- */

export function LogMethodModal({
  method,
  onClose,
  onUseManual,
}: {
  method: 'photo' | 'barcode' | 'voice';
  onClose: () => void;
  onUseManual: () => void;
}) {
  const copy = {
    photo: {
      title: 'Photo logging',
      body: 'Recognising food from a photo needs a vision model running server-side, plus camera permissions from a development build. Neither is wired up yet.',
    },
    barcode: {
      title: 'Barcode scanning',
      body: 'Scanning needs the camera and a product database to look the barcode up in. Both arrive with the food-database integration.',
    },
    voice: {
      title: 'Voice logging',
      body: 'Speech recognition needs microphone permissions from a development build and a transcription service. Not available in Expo Go.',
    },
  }[method];

  return (
    <Panel title={copy.title} subtitle="Not available yet" onClose={onClose}>
      <Text variant="body">{copy.body}</Text>
      <Text variant="caption" color="muted">
        You can log the same meal by hand in the meantime — it takes about the same number of
        taps.
      </Text>
      <Button label="Add manually instead" onPress={onUseManual} />
    </Panel>
  );
}

export { generateGuidance };
