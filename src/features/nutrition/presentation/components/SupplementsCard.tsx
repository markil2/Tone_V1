import { Pressable, View } from 'react-native';

import { Button, Icon, Stack, Text, useTheme } from '@/design-system';
import { GlowCard } from '@/features/dashboard';
import type { Supplement } from '../../domain/entities/nutrition';

export function SupplementsCard({
  supplements,
  onOpen,
}: {
  supplements: Supplement[];
  onOpen: () => void;
}) {
  const theme = useTheme();

  const taken = supplements.filter((entry) => entry.takenAt !== null).length;
  const status =
    supplements.length === 0
      ? 'No supplements added'
      : taken === 0
        ? 'Not logged'
        : `${taken} of ${supplements.length} logged`;

  return (
    <GlowCard>
      <Stack direction="row" gap="lg" align="center">
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: theme.colors.dashboard.bodyStroke,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="pill" size={24} color={theme.colors.accent} />
        </View>

        <Stack gap="xs" flex={1}>
          <Text variant="heading">Supplements</Text>
          <Text variant="caption" color="muted">
            Daily plan · {status}
          </Text>
          <Text variant="caption" color="muted">
            Follow your clinician’s plan — this is a log, not a recommendation.
          </Text>
        </Stack>

        <Button
          label="Log"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={onOpen}
        />
      </Stack>
    </GlowCard>
  );
}

/** A single supplement row inside the panel — tap to toggle taken. */
export function SupplementRow({
  supplement,
  onToggle,
  onRemove,
}: {
  supplement: Supplement;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const isTaken = supplement.takenAt !== null;

  const takenLabel = isTaken
    ? new Date(supplement.takenAt!).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not taken';

  return (
    <Stack direction="row" gap="md" align="center">
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isTaken }}
        accessibilityLabel={`${supplement.name}, ${supplement.dose}`}
        accessibilityHint={isTaken ? 'Marks as not taken' : 'Marks as taken now'}
        hitSlop={8}
        style={{
          width: 30,
          height: 30,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: isTaken ? theme.colors.accent : theme.colors.border,
        }}
      >
        <Icon
          name="check"
          size={15}
          color={isTaken ? theme.colors.accent : theme.colors.textMuted}
        />
      </Pressable>

      <Stack gap="xs" flex={1}>
        <Text variant="callout">{supplement.name}</Text>
        <Text variant="caption" color="muted">
          {supplement.dose} · {takenLabel}
        </Text>
        {supplement.notes ? (
          <Text variant="caption" color="muted">
            {supplement.notes}
          </Text>
        ) : null}
      </Stack>

      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${supplement.name}`}
        hitSlop={8}
      >
        <Icon name="trash" size={16} color={theme.colors.textMuted} />
      </Pressable>
    </Stack>
  );
}
