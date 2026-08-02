import { useQuery } from '@tanstack/react-query';

import { container } from '@/bootstrap/container';
import { unwrap } from '@/core/result';
import { useSession } from '@/features/auth';

/**
 * Query keys are centralised per feature so invalidation stays surgical.
 * Hierarchical by design: invalidating ['profile'] clears every user's profile,
 * while ['profile', userId] clears one.
 */
export const profileKeys = {
  all: ['profile'] as const,
  byUser: (userId: string) => ['profile', userId] as const,
};

/**
 * The user's profile as server state.
 *
 * Contrast with the session, which lives in Context: the profile is genuinely
 * fetched-and-cached data, so it belongs to TanStack Query.
 */
export function useProfile() {
  const { userId } = useSession();

  return useQuery({
    queryKey: profileKeys.byUser(userId ?? 'anonymous'),
    enabled: userId !== null,
    // unwrap() converts a domain Err into a rejection, which is the contract
    // TanStack Query's error state expects.
    queryFn: async () => unwrap(await container.profile.repository.getById(userId!)),
    // The route guard blocks on this; a stale-but-instant answer is better than
    // a spinner on every navigation.
    staleTime: 5 * 60_000,
  });
}
