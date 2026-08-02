import { Pressable, View } from 'react-native';

import { Icon, Stack, Text, useTheme } from '@/design-system';
import { glow } from '@/features/dashboard';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import type { Guidance } from '../../domain/use-cases/generate-guidance';

/**
 * AI guidance.
 *
 * Produced by the rule engine in `generate-guidance`, from the day's own numbers
 * plus the dashboard's recovery and strain — so it changes as the day does. The
 * card says where it comes from rather than implying a model wrote it.
 */
export function AIGuidanceCard({
  guidance,
  onPress,
}: {
  guidance: Guidance[];
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  const headline = guidance[0]?.message ?? 'Nothing to flag right now.';

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={`AI guidance. ${headline}`}
      accessibilityHint="Opens all of today's suggestions"
      style={({ pressed }) => [
        {
          backgroundColor: 'rgba(11, 18, 32, 0.72)',
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
          padding: theme.spacing.xl,
          opacity: pressed ? 0.85 : 1,
        },
        isFocused ? glow(theme.colors.dashboard.glowSoft, 12) : null,
      ]}
    >
      <Stack direction="row" gap="lg" align="center">
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: theme.colors.dashboard.bodyStroke,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="sparkle" size={22} color={theme.colors.accent} />
        </View>

        <Stack gap="xs" flex={1}>
          <Text variant="callout" color="accent">
            AI guidance
          </Text>
          <Text variant="body" accessibilityLiveRegion="polite">
            {headline}
          </Text>
        </Stack>

        <Icon name="chevronRight" size={18} color={theme.colors.textMuted} />
      </Stack>
    </Pressable>
  );
}
