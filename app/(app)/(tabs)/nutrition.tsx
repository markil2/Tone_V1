import { router } from 'expo-router';

import { NutritionScreen } from '@/features/nutrition';

export default function NutritionRoute() {
  return (
    <NutritionScreen
      onOpenProfile={() => router.push('/profile')}
      onOpenSettings={() => router.push('/settings')}
    />
  );
}
