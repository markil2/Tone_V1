import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';

import { Icon, Text, useTheme, type IconName } from '@/design-system';
import { haptics } from '@/shared/haptics';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { glow } from './GlowCard';

/**
 * The three destinations, in the order they must appear.
 *
 * Declared here rather than derived from `state.routes` on purpose: the tab
 * navigator also carries an `index` route that only redirects, and ordering in
 * the navigator state follows file-system order, not design order. Naming the
 * three explicitly means neither can quietly change what the bar shows.
 */
const NAV_ITEMS: { name: string; label: string; icon: IconName }[] = [
  { name: 'dashboard', label: 'Dashboard', icon: 'home' },
  { name: 'nutrition', label: 'Nutrition', icon: 'apple' },
  { name: 'training', label: 'Training', icon: 'dumbbell' },
];

/** One destination. Its own component so the focus-ring hook has a place to live. */
function NavItem({
  label,
  icon,
  isActive,
  onPress,
}: {
  label: string;
  icon: IconName;
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
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          // 48pt tall, comfortably above the 44pt minimum target.
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: isActive
            ? theme.colors.accent
            : isFocused
              ? theme.colors.dashboard.bodyStroke
              : 'transparent',
          backgroundColor: isActive ? theme.colors.dashboard.glowFaint : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
        isActive ? glow(theme.colors.dashboard.glow, 14) : null,
      ]}
    >
      <Icon
        name={icon}
        size={20}
        color={isActive ? theme.colors.accent : theme.colors.textMuted}
      />
      <Text variant="caption" color={isActive ? 'accent' : 'muted'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The floating bottom bar.
 *
 * Replaces the navigator's default bar (passed via `<Tabs tabBar={…}>`) because
 * the reference's active item is an outlined, glowing pill — not a tint change
 * on an icon, which is all the stock bar can express.
 */
export function BottomNavigation({ state, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      // Sits above the home indicator rather than under it. `insets` comes from
      // the navigator so a `safeAreaInsets` override is still respected.
      style={{
        paddingBottom: insets.bottom + theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        backgroundColor: theme.colors.dashboard.backdrop,
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.xs,
          borderWidth: 1,
          borderColor: theme.colors.dashboard.bodyStroke,
          borderRadius: theme.radius.full,
          padding: theme.spacing.xs,
          backgroundColor: 'rgba(11, 18, 32, 0.85)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const route = state.routes.find((candidate) => candidate.name === item.name);
          // A destination whose file is missing is a build-time mistake, not a
          // runtime state — but rendering a dead control would hide it.
          if (!route) return null;

          const isActive = route.name === activeRouteName;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) return;

            haptics.select();
            // Pressing the active tab still navigates: that is what resets a
            // deep stack back to the tab's root.
            navigation.navigate(route.name, route.params);
          };

          return (
            <NavItem
              key={route.key}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}
