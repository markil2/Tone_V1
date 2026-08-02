import { router } from 'expo-router';

import { Button, Screen, Stack, Text } from '@/design-system';

export default function NotFoundRoute() {
  return (
    <Screen>
      <Stack gap="lg" flex={1} justify="center">
        <Text variant="title">Page not found</Text>
        <Text variant="body" color="muted">
          That link doesn’t lead anywhere in the app.
        </Text>
        <Button label="Go home" onPress={() => router.replace('/')} />
      </Stack>
    </Screen>
  );
}
