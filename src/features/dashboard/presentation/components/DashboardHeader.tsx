import { Pressable, View } from 'react-native';

import { Icon, Stack, Text, useTheme, type IconName } from '@/design-system';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { glow } from './GlowCard';

/**
 * A circular icon button.
 *
 * Both header controls are the same shape at different sizes — the reference
 * gives the profile button visual priority over settings, which is the only
 * thing that differs.
 */
function CircleButton({
  icon,
  size,
  label,
  hint,
  onPress,
  children,
}: {
  icon: IconName;
  size: number;
  label: string;
  hint: string;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(11, 18, 32, 0.6)',
          opacity: pressed ? 0.7 : 1,
          overflow: 'hidden',
        },
        isFocused ? glow(theme.colors.dashboard.glowSoft, 10) : null,
      ]}
    >
      {children ?? <Icon name={icon} size={size * 0.45} color={theme.colors.textMuted} />}
    </Pressable>
  );
}

export type DashboardHeaderProps = {
  /** Used for the avatar placeholder's initial. Null before the profile loads. */
  displayName: string | null;
  email: string | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
};

/**
 * Profile and settings, top-right.
 *
 * Takes callbacks rather than pushing routes itself: the component stays
 * presentational, and the screen keeps every navigation decision in one place.
 */
export function DashboardHeader({
  displayName,
  email,
  onOpenProfile,
  onOpenSettings,
}: DashboardHeaderProps) {
  const theme = useTheme();
  const { isCompact } = useBreakpoint();

  // Falls back to the icon when there is no name or email to derive from.
  const initial = (displayName ?? email ?? '').trim().charAt(0).toUpperCase();

  return (
    <Stack direction={isCompact ? 'row' : 'column'} gap="sm" align="center">
      <CircleButton
        icon="user"
        size={48}
        label={displayName ? `Profile for ${displayName}` : 'Your profile'}
        hint="Opens your profile and survey answers"
        onPress={onOpenProfile}
      >
        {initial ? (
          <View
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.dashboard.glowFaint,
            }}
          >
            <Text variant="heading" color="accent">
              {initial}
            </Text>
          </View>
        ) : undefined}
      </CircleButton>

      <CircleButton
        icon="gear"
        size={38}
        label="Settings"
        hint="Opens notifications, units, privacy and app settings"
        onPress={onOpenSettings}
      />
    </Stack>
  );
}
