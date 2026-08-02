import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { container } from '@/bootstrap/container';
import { logger } from '@/core/logger';
import { isErr } from '@/core/result';
import {
  Button,
  Card,
  Screen,
  Stack,
  Text,
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@/design-system';

const PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];

export function ProfileScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const [isSigningOut, setSigningOut] = useState(false);

  /**
   * With auth removed there is no account to leave, so this clears the device's
   * data and mints a fresh local identity — which sends the user back through
   * the survey. Confirmed first, because it is not recoverable.
   */
  const handleReset = () => {
    const run = async () => {
      setSigningOut(true);
      const result = await container.auth.signOut();
      if (isErr(result)) {
        logger.error('Reset failed', result.error);
        setSigningOut(false);
      }
      // On success the SessionProvider observes the new identity and the (app)
      // route guard redirects into onboarding — no manual navigation needed.
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Reset app data? Your survey answers and logs will be erased.')) {
        void run();
      }
      return;
    }

    Alert.alert(
      'Reset app data?',
      'Your survey answers, targets and logged data on this device will be erased. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => void run() },
      ],
    );
  };

  return (
    <Screen scroll edgeToEdgeBottom={false}>
      <Stack gap="xl" style={{ paddingVertical: theme.spacing.xl }}>
        <Text variant="title">Profile</Text>

        <Card>
          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Local profile
            </Text>
            <Text variant="heading">This device</Text>
            <Text variant="caption" color="muted">
              Sign-in is off, so your data lives on this device only and is not backed up
              or synced.
            </Text>
          </Stack>
        </Card>

        <Stack gap="md">
          <Text variant="heading">Appearance</Text>
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
        </Stack>

        <Card>
          <Stack gap="sm">
            <Text variant="heading">Coming next</Text>
            <Text variant="body" color="muted">
              Units, timezone and goals land in Milestone 2, stored on your profile
              row so they sync across devices.
            </Text>
          </Stack>
        </Card>

        <Button
          label="Reset app data"
          variant="secondary"
          onPress={handleReset}
          loading={isSigningOut}
        />
      </Stack>
    </Screen>
  );
}
