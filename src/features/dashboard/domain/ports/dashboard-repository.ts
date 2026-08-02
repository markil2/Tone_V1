import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { DashboardMetrics } from '../entities/dashboard';

/**
 * Where the day's health figures come from.
 *
 * One method, deliberately: everything the dashboard renders is derived from a
 * single day's snapshot. When HealthKit lands it becomes another implementation
 * of this port and nothing above it changes — which is the whole reason the port
 * exists this early, while there is only a mock behind it.
 */
export type DashboardRepository = {
  /** The current snapshot for a user. `null` when nothing has been generated yet. */
  getMetrics(userId: string): Promise<Result<DashboardMetrics | null, AppError>>;

  /** Persist a freshly generated snapshot — used right after onboarding. */
  saveMetrics(userId: string, metrics: DashboardMetrics): Promise<Result<void, AppError>>;
};
