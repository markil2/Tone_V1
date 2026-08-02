import { Pressable, ScrollView } from 'react-native';

import { Icon, Stack, Text, useTheme, type IconName } from '@/design-system';
import { glow } from '@/features/dashboard';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { ACTIVITY_LABELS, ACTIVITY_TYPES, type ActivityType } from '../../domain/entities/workout';

const ICONS: Record<ActivityType, IconName> = {
  run: 'run',
  walk: 'walk',
  cycle: 'cycle',
  sports: 'sports',
  weightlifting: 'dumbbell',
};

function ActivityButton({
  type,
  isActive,
  onPress,
}: {
  type: ActivityType;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={ACTIVITY_LABELS[type]}
      style={({ pressed }) => [
        {
          flex: 1,
          minWidth: 88,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.xs,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: isActive
            ? theme.colors.accent
            : isFocused
              ? theme.colors.dashboard.bodyStroke
              : 'transparent',
          backgroundColor: isActive ? theme.colors.dashboard.glowFaint : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
        isActive ? glow(theme.colors.dashboard.glowSoft, 12) : null,
      ]}
    >
      <Icon
        name={ICONS[type]}
        size={26}
        color={isActive ? theme.colors.accent : theme.colors.text}
      />
      <Text variant="caption" color={isActive ? 'accent' : 'muted'}>
        {ACTIVITY_LABELS[type]}
      </Text>
    </Pressable>
  );
}

/**
 * Run · Walk · Cycle · Sports · Weightlifting.
 *
 * Only weightlifting has a session engine behind it today; the others select but
 * say plainly that their tracking is not built, rather than opening an empty
 * screen that looks broken.
 */
export function ActivityTypeSelector({
  value,
  onChange,
}: {
  value: ActivityType;
  onChange: (type: ActivityType) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ minWidth: '100%' }}
    >
      <Stack
        direction="row"
        gap="none"
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.dashboard.bodyStroke,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.xs,
        }}
      >
        {ACTIVITY_TYPES.map((type) => (
          <ActivityButton
            key={type}
            type={type}
            isActive={type === value}
            onPress={() => onChange(type)}
          />
        ))}
      </Stack>
    </ScrollView>
  );
}
