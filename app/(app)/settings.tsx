import { router } from 'expo-router';

import { SettingsScreen } from '@/features/profile';

export default function SettingsRoute() {
  // `back()` would strand a user who deep-linked straight here, so fall back to
  // the dashboard when there is nothing to go back to.
  const close = () => (router.canGoBack() ? router.back() : router.replace('/dashboard'));

  return <SettingsScreen onClose={close} />;
}
