import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth';
import { WorkoutSessionScreen, useActiveWorkout } from '@/features/training';
import { localKeys, writeJson } from '@/lib/local-store';

export default function WorkoutRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const workout = useActiveWorkout((state) => state.workout);
  const start = useActiveWorkout((state) => state.start);

  // Starting on mount rather than on the Training screen's button keeps the
  // session tied to this route: arriving here by deep link works the same way.
  useEffect(() => {
    if (!workout) start('weightlifting', mode === 'routine' ? 'Routine' : 'Free workout');
  }, [workout, start, mode]);

  const exit = () => (router.canGoBack() ? router.back() : router.replace('/training'));

  const handleFinished = async () => {
    if (userId) {
      await writeJson(localKeys.firstWorkoutCompleted(userId), true);
      await queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    }
    exit();
  };

  return (
    <WorkoutSessionScreen
      onExit={exit}
      onFinished={() => void handleFinished()}
      onOpenFormCheck={(exerciseId) => router.push(`/form-check?exerciseId=${exerciseId}`)}
    />
  );
}
