import type { ReactNode } from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInRight,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Stack, Text, useTheme } from '@/design-system';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { glow } from './GlowCard';

/** Written out rather than using `inset`, which native has only supported recently. */
const FILL: ViewStyle = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

/** The dismiss affordance shared by every panel and detail card. */
export function CloseButton({
  label,
  onPress,
  size = 32,
}: {
  label: string;
  onPress: () => void;
  size?: number;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      style={({ pressed }) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : theme.colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name="close" size={size / 2} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export type PanelProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * The dashboard's overlay shell — one implementation for every detail view.
 *
 * Deliberately not an RN `Modal`. The dashboard's panels sit inside the screen's
 * own stacking context so the bottom navigation stays visible and usable
 * underneath them, which a `Modal` would cover. The trade-off is that focus
 * containment has to be declared explicitly, hence `accessibilityViewIsModal`.
 *
 * Shape follows the breakpoint: a bottom sheet where a thumb reaches the bottom
 * of the screen, a right-anchored drawer where there is width to spare.
 */
export function Panel({ title, subtitle, onClose, children }: PanelProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isCompact, height } = useBreakpoint();
  const reducedMotion = useReducedMotion();

  const entering = reducedMotion
    ? undefined
    : isCompact
      ? SlideInDown.duration(theme.motion.base)
      : SlideInRight.duration(theme.motion.base);

  return (
    <View style={FILL} accessibilityViewIsModal role="dialog">
      <Animated.View
        entering={reducedMotion ? undefined : FadeIn.duration(theme.motion.fast)}
        exiting={reducedMotion ? undefined : FadeOut.duration(theme.motion.fast)}
        style={FILL}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close panel"
          style={{ flex: 1, backgroundColor: 'rgba(2, 5, 10, 0.72)' }}
        />
      </Animated.View>

      <Animated.View
        entering={entering}
        style={[
          {
            position: 'absolute',
            backgroundColor: theme.colors.dashboard.backdrop,
            borderColor: theme.colors.dashboard.bodyStroke,
            borderWidth: 1,
          },
          isCompact
            ? {
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: height * 0.82,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                paddingBottom: insets.bottom + theme.spacing.lg,
              }
            : {
                top: theme.spacing.xl,
                right: theme.spacing.xl,
                bottom: theme.spacing.xl,
                width: 400,
                borderRadius: theme.radius.xl,
              },
          glow(theme.colors.dashboard.glowSoft, 24),
        ]}
      >
        <Stack
          direction="row"
          justify="space-between"
          align="flex-start"
          gap="lg"
          style={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.md }}
        >
          <Stack gap="xs" flex={1}>
            <Text variant="heading">{title}</Text>
            {subtitle ? (
              <Text variant="caption" color="muted">
                {subtitle}
              </Text>
            ) : null}
          </Stack>

          <CloseButton label={`Close ${title}`} onPress={onClose} />
        </Stack>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** A labelled row, the repeating unit inside almost every panel. */
export function PanelRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const theme = useTheme();

  return (
    <Stack gap="xs" style={{ paddingVertical: theme.spacing.sm }}>
      <Stack direction="row" justify="space-between" align="center" gap="md">
        <Text variant="callout" color="muted" style={{ flex: 1 }}>
          {label}
        </Text>
        <Text variant="callout" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </Stack>
      {hint ? (
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      ) : null}
    </Stack>
  );
}
