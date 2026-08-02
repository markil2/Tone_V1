import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Icon,
  Stack,
  Text,
  useTheme,
  useThemePreference,
  type IconName,
  type ThemePreference,
} from '@/design-system';
import { useOnboardingDraft } from '@/features/onboarding';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import { useProfile } from '../hooks/useProfile';

const PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];

function SettingRow({
  icon,
  title,
  description,
  right,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  const content = (
    <Stack direction="row" gap="md" align="center">
      <Icon name={icon} size={20} color={theme.colors.textMuted} />
      <Stack gap="xs" flex={1}>
        <Text variant="callout">{title}</Text>
        <Text variant="caption" color="muted">
          {description}
        </Text>
      </Stack>
      {right}
    </Stack>
  );

  if (!onPress) {
    return <View style={{ paddingVertical: theme.spacing.md }}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      style={({ pressed }) => ({
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        marginHorizontal: -theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: isFocused ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}

/**
 * App settings.
 *
 * Toggles that have somewhere to write to are live. The ones that depend on
 * capabilities the app does not have yet — device pairing, health permissions —
 * are shown disabled with the reason, rather than as switches that silently do
 * nothing when flipped.
 */
export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { preference, setPreference } = useThemePreference();
  const { data: profile } = useProfile();
  const resetDraft = useOnboardingDraft((state) => state.reset);

  const [notifications, setNotifications] = useState(false);

  /**
   * Re-runs the survey rather than clearing the completion flag.
   *
   * Nulling `onboarded_at` needs an RPC that does not exist yet — the migration
   * grants no such write. Re-answering overwrites every answer through the same
   * path onboarding already uses, which is the outcome the user is after, and
   * the confirmation text says exactly that so nobody expects a wipe.
   */
  const confirmReset = () => {
    const run = () => {
      resetDraft();
      onClose();
      // The onboarding route is exempt from the profile gate, so it is reachable
      // even though this account is already marked onboarded.
      router.replace('/onboarding');
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Retake the survey? Your current answers will be replaced.')) {
        run();
      }
      return;
    }

    Alert.alert(
      'Retake the survey?',
      'You’ll answer the questions again and your current answers will be replaced. Your logged data is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retake', style: 'destructive', onPress: run },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing['2xl'],
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.xl,
          maxWidth: 640,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Stack direction="row" justify="space-between" align="center" gap="md">
          <Text variant="title">Settings</Text>
          <Button label="Done" variant="ghost" size="sm" fullWidth={false} onPress={onClose} />
        </Stack>

        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.8 }}>
            NOTIFICATIONS
          </Text>
          <SettingRow
            icon="bell"
            title="Daily reminders"
            description="Nudges to log and a wind-down prompt before your sleep goal."
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                accessibilityLabel="Daily reminders"
                trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
              />
            }
          />
          {notifications ? (
            <Text variant="caption" color="muted">
              Saved on this device only — scheduling arrives with the notifications milestone.
            </Text>
          ) : null}
        </Stack>

        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.8 }}>
            UNITS
          </Text>
          <SettingRow
            icon="ruler"
            title="Measurement system"
            description={
              profile
                ? `Currently ${profile.unitSystem}. Set during onboarding; retake the survey to change it.`
                : 'Set during onboarding.'
            }
          />
        </Stack>

        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.8 }}>
            APPEARANCE
          </Text>
          <Stack direction="row" gap="sm">
            {PREFERENCES.map((option) => (
              <Button
                key={option}
                label={option[0]!.toUpperCase() + option.slice(1)}
                variant={preference === option ? 'primary' : 'secondary'}
                size="sm"
                fullWidth={false}
                onPress={() => setPreference(option)}
                style={{ flex: 1 }}
              />
            ))}
          </Stack>
          <Text variant="caption" color="muted">
            The dashboard and training screens stay dark by design.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.8 }}>
            DATA & PRIVACY
          </Text>
          <SettingRow
            icon="shield"
            title="Privacy"
            description="Your health data is readable only by you — enforced by row-level security on every table."
          />
          <SettingRow
            icon="watch"
            title="Connected devices"
            description="Apple Watch and wearable pairing needs a development build. Not available yet."
          />
          <SettingRow
            icon="heart"
            title="Health data permissions"
            description="HealthKit and Health Connect access is requested once those integrations ship."
          />
        </Stack>

        <Stack gap="sm">
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.8 }}>
            ONBOARDING
          </Text>
          <Button label="Retake the survey" variant="secondary" onPress={confirmReset} />
          <Text variant="caption" color="muted">
            Replaces your current answers and recalculates your targets. Logged data is kept.
          </Text>
        </Stack>
      </ScrollView>
    </View>
  );
}
