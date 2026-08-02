import { router } from 'expo-router';

import { DashboardScreen } from '@/features/dashboard';

export default function DashboardRoute() {
  return (
    <DashboardScreen
      onOpenProfile={() => router.push('/profile')}
      onOpenSettings={() => router.push('/settings')}
    />
  );
}
