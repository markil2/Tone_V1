import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logger } from '@/core/logger';
import { Button, Screen, Stack, Text } from '@/design-system';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Last line of defence against a white screen.
 *
 * Class component because React still offers no hook-based equivalent for
 * componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Uncaught render error', error, { componentStack: info.componentStack });
  }

  private reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Screen>
        <Stack gap="lg" flex={1} justify="center">
          <Text variant="title">Something went wrong</Text>
          <Text variant="body" color="muted">
            The app hit an unexpected error. Your data is safe.
          </Text>
          {__DEV__ ? (
            <Text variant="caption" color="danger">
              {error.message}
            </Text>
          ) : null}
          <Button label="Try again" onPress={this.reset} />
        </Stack>
      </Screen>
    );
  }
}
