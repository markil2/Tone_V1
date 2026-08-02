/**
 * GENERATED FILE — do not edit by hand.
 *
 * Replace with real output once the Supabase project exists (Milestone 1):
 *   npm run db:types
 *
 * Until then this hand-written stub mirrors supabase/migrations/0001_init.sql so
 * the client is type-checked from day one.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UnitSystem = 'metric' | 'imperial';
export type PrimaryGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_performance'
  | 'maintain_fitness';
export type BiologicalSex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'moderately_active' | 'very_active';

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  unit_system: UnitSystem;
  primary_goal: PrimaryGoal | null;
  biological_sex: BiologicalSex | null;
  birth_year: number | null;
  height_cm: number | null;
  starting_weight_kg: number | null;
  activity_level: ActivityLevel | null;
  training_days_per_week: number | null;
  focus: string[];
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

type UserTargetRow = {
  id: string;
  user_id: string;
  effective_from: string;
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  sleep_minutes: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>> & {
          id: string;
        };
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      user_targets: {
        Row: UserTargetRow;
        Insert: Omit<UserTargetRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<UserTargetRow, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /**
       * Writes the profile and its derived targets in one transaction.
       * See supabase/migrations/0001_init.sql.
       */
      complete_onboarding: {
        Args: {
          p_primary_goal: PrimaryGoal;
          p_biological_sex: BiologicalSex;
          p_birth_year: number;
          p_height_cm: number;
          p_weight_kg: number;
          p_activity_level: ActivityLevel;
          p_training_days_per_week: number;
          p_focus: string[];
          p_unit_system: UnitSystem;
          p_calorie_target: number;
          p_protein_g: number;
          p_carbs_g: number;
          p_fat_g: number;
          p_water_ml: number;
          p_sleep_minutes: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      unit_system: UnitSystem;
      primary_goal: PrimaryGoal;
      biological_sex: BiologicalSex;
      activity_level: ActivityLevel;
    };
    CompositeTypes: Record<string, never>;
  };
};

/** Convenience aliases so features don't repeat the deep index type. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
