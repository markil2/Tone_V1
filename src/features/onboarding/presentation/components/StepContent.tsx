import { View } from 'react-native';

import { NumberField, Stack, Text, useTheme } from '@/design-system';
import { haptics } from '@/shared/haptics';
import { kgToLb, lbToKg, round, type UnitSystem } from '@/shared/units';
import {
  AGE_RANGE,
  TRAINING_DAYS_RANGE,
  WEIGHT_KG_RANGE,
} from '../../domain/use-cases/validation';
import {
  ACTIVITY_OPTIONS,
  FOCUS_OPTIONS,
  GOAL_OPTIONS,
  SEX_OPTIONS,
  type StepId,
} from '../config/steps';
import { useOnboardingDraft } from '../store/onboarding-draft';
import { HeightInput } from './HeightInput';
import { NumberRow } from './NumberRow';
import { OptionCard } from './OptionCard';
import { PillToggle } from './PillToggle';
import { SegmentedControl } from './SegmentedControl';

const UNIT_OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

/**
 * Renders the body of a step.
 *
 * A switch rather than a generic schema-driven renderer: each input is
 * fully type-safe against its own field, and a new question type never has to be
 * squeezed into a shared abstraction. The flow's *shape* is data (config/steps.ts);
 * only the rendering is code.
 */
export function StepContent({
  stepId,
  onAutoAdvance,
}: {
  stepId: StepId;
  onAutoAdvance: () => void;
}) {
  const theme = useTheme();
  const draft = useOnboardingDraft();

  /** Choice steps commit and advance in one tap. */
  const choose = <K extends 'primaryGoal' | 'biologicalSex' | 'activityLevel'>(
    key: K,
    value: NonNullable<(typeof draft)[K]>,
  ) => {
    haptics.select();
    draft.setField(key, value);
    onAutoAdvance();
  };

  switch (stepId) {
    case 'goal':
      return (
        <Stack gap="md">
          {GOAL_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              description={option.description}
              glyph={option.glyph}
              selected={draft.primaryGoal === option.value}
              onPress={() => choose('primaryGoal', option.value)}
            />
          ))}
        </Stack>
      );

    case 'sex':
      return (
        <Stack gap="lg">
          <Stack gap="md">
            {SEX_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                selected={draft.biologicalSex === option.value}
                onPress={() => choose('biologicalSex', option.value)}
              />
            ))}
          </Stack>
          {/* Stated plainly, because being asked this without a reason is the
              kind of thing that makes people abandon a health app. */}
          <Text variant="caption" color="muted">
            We ask because the equation that estimates your metabolic rate is
            calibrated on biological sex. It is not a question about gender identity.
          </Text>
        </Stack>
      );

    case 'age':
      return (
        <NumberField
          value={draft.age}
          onChange={(value) => draft.setField('age', value)}
          min={AGE_RANGE.min}
          max={AGE_RANGE.max}
          unit="years"
          // The only field on its screen, so the keyboard should already be up.
          autoFocus
        />
      );

    case 'body':
      return (
        <Stack gap="2xl">
          <SegmentedControl
            options={UNIT_OPTIONS}
            value={draft.unitSystem}
            onChange={(value) => draft.setField('unitSystem', value)}
            size="sm"
          />

          {/* Both inputs are remounted on unit change: they seed their text from
              `value` once, so a new key is what reloads them in the new unit. */}
          <HeightInput
            key={`height-${draft.unitSystem}`}
            valueCm={draft.heightCm}
            onChange={(cm) => draft.setField('heightCm', cm)}
            unitSystem={draft.unitSystem}
          />

          {draft.unitSystem === 'metric' ? (
            <NumberField
              key="weight-metric"
              label="Weight"
              value={draft.weightKg}
              onChange={(kg) => draft.setField('weightKg', kg)}
              min={WEIGHT_KG_RANGE.min}
              max={WEIGHT_KG_RANGE.max}
              unit="kg"
              allowDecimal
            />
          ) : (
            <NumberField
              key="weight-imperial"
              label="Weight"
              // Displayed in pounds, stored in kilograms — the domain and the
              // database only ever see SI.
              value={draft.weightKg === null ? null : round(kgToLb(draft.weightKg))}
              onChange={(lb) => draft.setField('weightKg', lb === null ? null : lbToKg(lb))}
              // Round INWARD, like HeightInput does. Math.round(kgToLb(30)) is
              // 66 lb, which converts back to 29.9 kg — under the domain
              // minimum, so the field would accept a value that the schema then
              // rejects on the final tap, with no field left to correct.
              min={Math.ceil(kgToLb(WEIGHT_KG_RANGE.min))}
              max={Math.floor(kgToLb(WEIGHT_KG_RANGE.max))}
              unit="lb"
            />
          )}
        </Stack>
      );

    case 'activity':
      return (
        <Stack gap="md">
          {ACTIVITY_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              description={option.description}
              glyph={option.glyph}
              selected={draft.activityLevel === option.value}
              onPress={() => choose('activityLevel', option.value)}
            />
          ))}
        </Stack>
      );

    case 'training':
      return (
        <Stack gap="xl">
          <NumberRow
            min={TRAINING_DAYS_RANGE.min}
            max={TRAINING_DAYS_RANGE.max}
            value={draft.trainingDaysPerWeek}
            onChange={(value) => draft.setField('trainingDaysPerWeek', value)}
          />
          <Text variant="caption" color="muted" align="center">
            {draft.trainingDaysPerWeek === 0
              ? 'No structured training right now — that’s fine.'
              : `${draft.trainingDaysPerWeek} ${
                  draft.trainingDaysPerWeek === 1 ? 'session' : 'sessions'
                } a week`}
          </Text>
        </Stack>
      );

    case 'focus':
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {FOCUS_OPTIONS.map((option) => (
            <PillToggle
              key={option.value}
              label={option.label}
              glyph={option.glyph}
              tint={theme.colors.domain[option.value]}
              selected={draft.focus.includes(option.value)}
              onToggle={() => draft.toggleFocus(option.value)}
            />
          ))}
        </View>
      );
  }
}
