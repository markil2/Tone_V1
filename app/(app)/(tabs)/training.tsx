import { router } from 'expo-router';

import { TrainingScreen } from '@/features/training';

export default function TrainingRoute() {
  return (
    <TrainingScreen
      onStartWorkout={(mode) => router.push(`/workout?mode=${mode}`)}
      onOpenFormCheck={() => router.push('/form-check')}
      onOpenProfile={() => router.push('/profile')}
      onOpenSettings={() => router.push('/settings')}
    />
  );
}
