import { Button, Screen, Stack, Text } from '@/design-system';

/**
 * Shown when app-critical data fails to load.
 *
 * Exists so a transient network failure surfaces as something the user can act
 * on, rather than being silently interpreted as missing data — which is how a
 * failed profile fetch would otherwise look identical to "not onboarded yet".
 */
export function RetryScreen({
  title = "We couldn't load your account",
  message = 'Check your connection and try again.',
  onRetry,
  isRetrying = false,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Screen>
      <Stack gap="lg" flex={1} justify="center">
        <Text variant="title">{title}</Text>
        <Text variant="body" color="muted">
          {message}
        </Text>
        <Button label="Try again" onPress={onRetry} loading={isRetrying} />
      </Stack>
    </Screen>
  );
}
