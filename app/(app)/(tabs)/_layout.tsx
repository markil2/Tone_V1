import { Tabs } from 'expo-router/js-tabs';

import { BottomNavigation } from '@/features/dashboard';

/**
 * Three tabs: Dashboard · Nutrition · Training.
 *
 * `Tabs` comes from `expo-router/js-tabs` because the root `expo-router` export
 * is deprecated in SDK 57 — and that entry point is also the only one exposing
 * the tab-bar prop types.
 *
 * The bar itself is ours: the design's active item is an outlined, glowing pill,
 * which the stock bar cannot express.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Redirect-only. `href: null` keeps it out of the bar while still giving
          the group a valid initial route. */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="training" options={{ title: 'Training' }} />
    </Tabs>
  );
}
