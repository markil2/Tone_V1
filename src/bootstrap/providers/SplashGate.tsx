import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/design-system';

/**
 * Shown while auth or profile state resolves.
 *
 * Uses the theme background rather than a bare spinner so restoring a session
 * doesn't flash white on a dark-mode device.
 */
export function SplashGate() {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}
