import { useQuery } from '@tanstack/react-query';

import { container } from '@/bootstrap/container';
import { unwrap } from '@/core/result';
import { useSession } from '@/features/auth';

export const targetsKeys = {
  all: ['targets'] as const,
  byUser: (userId: string) => ['targets', userId] as const,
};

/**
 * The user's current daily targets.
 *
 * Separate from `useProfile` rather than folded into it because the two change
 * on different cadences — targets get a new row whenever weight or goals move,
 * while the profile is mostly static — and only some screens need both.
 */
export function useDailyTargets() {
  const { userId } = useSession();

  return useQuery({
    queryKey: targetsKeys.byUser(userId ?? 'anonymous'),
    enabled: userId !== null,
    queryFn: async () => unwrap(await container.profile.repository.getTargets(userId!)),
    staleTime: 5 * 60_000,
  });
}
