import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { NutritionData } from '../entities/nutrition';

/**
 * Where a day's nutrition comes from.
 *
 * `seedDay` is synchronous and separate from the reads because the first open of
 * a new day must render immediately — waiting on storage to tell us "nothing
 * here" before showing anything would flash an empty page every morning.
 */
export type NutritionRepository = {
  getDay(userId: string, date: string): Promise<Result<NutritionData | null, AppError>>;
  saveDay(userId: string, data: NutritionData): Promise<Result<void, AppError>>;
  /** A fresh day, before anything has been logged. */
  seedDay(date: Date): NutritionData;
};
