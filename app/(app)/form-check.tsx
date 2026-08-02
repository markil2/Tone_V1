import { router, useLocalSearchParams } from 'expo-router';

import { findFormCheckExercise, FormCheckScreen } from '@/features/form-check';

export default function FormCheckRoute() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/training'));

  return (
    <FormCheckScreen
      onExit={exit}
      initialExercise={exerciseId ? findFormCheckExercise(exerciseId) : undefined}
    />
  );
}
