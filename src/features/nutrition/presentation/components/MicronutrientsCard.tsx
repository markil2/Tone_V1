import { Pressable } from 'react-native';

import { Icon, Stack, Text, useTheme, type IconName } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import type { Micronutrient, MicronutrientId } from '../../domain/entities/nutrition';
import {
  PROGRESS_LABELS,
  progressRatio,
  progressStatus,
} from '../../domain/use-cases/progress-status';
import { ProgressRing } from './ProgressRing';

const ICONS: Record<MicronutrientId, IconName> = {
  iron: 'leaf',
  calcium: 'bone',
  vitamin_d: 'sun',
  fiber: 'wheat',
};

function MicroCell({
  micro,
  onPress,
}: {
  micro: Micronutrient;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  const status = progressStatus(micro.consumed, micro.goal);
  const ratio = progressRatio(micro.consumed, micro.goal);
  const label = status === 'low' ? 'Add variety' : 'Good variety';
  const color = status === 'low' ? theme.colors.warning : theme.colors.accent;

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`${micro.name}, ${micro.consumed} of ${micro.goal} ${micro.unit}, ${PROGRESS_LABELS[status]}`}
      accessibilityHint="Opens sources and recommended intake"
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 140,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <ProgressRing ratio={ratio} size={40} strokeWidth={3} color={color}>
        <Icon name={ICONS[micro.id]} size={16} color={color} />
      </ProgressRing>

      <Stack gap="xs" flex={1}>
        <Text variant="caption">{micro.name}</Text>
        <Text variant="caption" style={{ color }} numberOfLines={1}>
          {label}
        </Text>
      </Stack>
    </Pressable>
  );
}

export function MicronutrientsCard({
  micronutrients,
  onSelect,
}: {
  micronutrients: Micronutrient[];
  onSelect: (micro: Micronutrient) => void;
}) {
  return (
    <GlowCard>
      <Stack gap="md">
        <Text variant="heading">Micronutrients</Text>
        <Stack direction="row" gap="sm" wrap>
          {micronutrients.map((micro) => (
            <MicroCell key={micro.id} micro={micro} onPress={() => onSelect(micro)} />
          ))}
        </Stack>
      </Stack>
    </GlowCard>
  );
}
