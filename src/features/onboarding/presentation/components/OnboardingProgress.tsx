import { View } from 'react-native';

import { Stack, Text, useTheme } from '@/design-system';
import { SECTIONS, STEPS, type SectionId } from '../config/steps';

export type OnboardingProgressProps = {
  stepIndex: number;
};

/**
 * Sectioned progress indicator.
 *
 * One segment per section, each filling proportionally to the steps completed
 * inside it. A plain 1-of-7 bar tells the user how much is left; this also tells
 * them what kind of question is coming, which measurably steadies drop-off in
 * multi-step forms.
 */
export function OnboardingProgress({ stepIndex }: OnboardingProgressProps) {
  const theme = useTheme();

  const currentSection = STEPS[Math.min(stepIndex, STEPS.length - 1)]?.section;

  const fillFor = (sectionId: SectionId): number => {
    const stepsInSection = STEPS.filter((s) => s.section === sectionId);
    const firstIndex = STEPS.findIndex((s) => s.section === sectionId);
    const completed = Math.min(
      Math.max(stepIndex - firstIndex, 0),
      stepsInSection.length,
    );
    return completed / stepsInSection.length;
  };

  return (
    <Stack gap="sm">
      <Stack direction="row" gap="xs">
        {SECTIONS.map((section) => (
          <View
            key={section.id}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.border,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${fillFor(section.id) * 100}%`,
                height: '100%',
                borderRadius: 2,
                backgroundColor: theme.colors.accent,
              }}
            />
          </View>
        ))}
      </Stack>

      <Stack direction="row" justify="space-between">
        <Text variant="caption" color="muted">
          {SECTIONS.find((s) => s.id === currentSection)?.label ?? ''}
        </Text>
        <Text variant="caption" color="muted">
          {Math.min(stepIndex + 1, STEPS.length)} of {STEPS.length}
        </Text>
      </Stack>
    </Stack>
  );
}
