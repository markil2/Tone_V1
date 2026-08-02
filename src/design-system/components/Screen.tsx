import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off by default so fixed layouts stay fixed. */
  scroll?: boolean;
  /** Applies horizontal gutters. Disable for edge-to-edge content like charts. */
  padded?: boolean;
  /** Respect the bottom safe area. Turn off inside tab screens (the tab bar owns it). */
  edgeToEdgeBottom?: boolean;
  style?: ViewStyle;
};

/**
 * Root container for every screen: background color, safe areas and gutters in
 * one place, so no screen re-derives them and drifts.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edgeToEdgeBottom = true,
  style,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const container: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };

  const content: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: edgeToEdgeBottom ? insets.bottom : 0,
    paddingHorizontal: padded ? theme.spacing.lg : 0,
  };

  if (scroll) {
    return (
      <ScrollView
        style={container}
        contentContainerStyle={[content, { flexGrow: 1 }, style]}
        keyboardShouldPersistTaps="handled"
        // Keeps the submit button reachable when a keyboard is up, without every
        // screen hand-rolling a KeyboardAvoidingView.
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[container, content, style]}>{children}</View>;
}
