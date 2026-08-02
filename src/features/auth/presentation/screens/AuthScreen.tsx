import { Link } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Stack, Text, TextField } from '@/design-system';
import { useAuthForm } from '../hooks/useAuthForm';

type Props = { mode: 'signIn' | 'signUp' };

const COPY = {
  signIn: {
    title: 'Welcome back',
    subtitle: 'Sign in to pick up where you left off.',
    action: 'Sign in',
    switchPrompt: 'New here?',
    switchAction: 'Create an account',
    switchHref: '/sign-up',
  },
  signUp: {
    title: 'Create your account',
    subtitle: 'Start tracking training, recovery and nutrition in one place.',
    action: 'Create account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign in',
    switchHref: '/sign-in',
  },
} as const;

/**
 * One screen serves both modes — the layouts are identical and would otherwise
 * drift apart. Note how little this file does: no validation, no error mapping,
 * no navigation. That work belongs to the use-case and the route guard.
 */
export function AuthScreen({ mode }: Props) {
  const copy = COPY[mode];
  const form = useAuthForm(mode);

  return (
    <Screen scroll>
      {/* Plain View, not KeyboardAvoidingView: Screen's ScrollView already sets
          automaticallyAdjustKeyboardInsets, and on iOS both would compensate for
          the same keyboard — pushing the form up by roughly twice its height and
          scrolling the title off-screen. */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Stack gap="2xl">
          <Stack gap="sm">
            <Text variant="display">{copy.title}</Text>
            <Text variant="body" color="muted">
              {copy.subtitle}
            </Text>
          </Stack>

          <Stack gap="lg">
            <TextField
              label="Email"
              value={form.email}
              onChangeText={form.setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <TextField
              label="Password"
              value={form.password}
              onChangeText={form.setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              // Prompts the OS to offer a strong password on sign-up.
              textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
              onSubmitEditing={form.canSubmit ? form.submit : undefined}
              returnKeyType="go"
            />

            {form.error ? (
              <Text variant="caption" color="danger">
                {form.error}
              </Text>
            ) : null}

            {form.notice ? (
              <Text variant="caption" color="success">
                {form.notice}
              </Text>
            ) : null}
          </Stack>

          <Stack gap="lg">
            <Button
              label={copy.action}
              onPress={form.submit}
              loading={form.isSubmitting}
              disabled={!form.canSubmit}
              size="lg"
            />

            <Stack direction="row" gap="xs" justify="center">
              <Text variant="caption" color="muted">
                {copy.switchPrompt}
              </Text>
              <Link href={copy.switchHref} replace>
                <Text variant="caption" color="accent">
                  {copy.switchAction}
                </Text>
              </Link>
            </Stack>

            {/* TODO(M2): Sign in with Apple — required by App Store review once
                any third-party sign-in is offered. One adapter method, one button. */}
          </Stack>
        </Stack>
      </View>
    </Screen>
  );
}
