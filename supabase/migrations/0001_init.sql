-- ============================================================================
-- 0001_init — identity, profiles and derived targets.
--
-- Principles applied throughout:
--   • RLS is enabled on every table, from the first migration. This is health
--     data; there is no phase in which skipping it is acceptable.
--   • Canonical SI units in storage (cm, kg, ml). Imperial exists only in the UI.
--   • Onboarding answers live on the profile; derived targets live in their own
--     table with history, because they change whenever weight or goals change
--     and the AI layer needs to know which target was active on a given date.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ enums ---
create type public.unit_system   as enum ('metric', 'imperial');
create type public.primary_goal  as enum ('lose_weight', 'build_muscle', 'improve_performance', 'maintain_fitness');
create type public.biological_sex as enum ('male', 'female');
create type public.activity_level as enum ('sedentary', 'moderately_active', 'very_active');

-- --------------------------------------------------------------- profiles ---
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,

  display_name           text,
  avatar_url             text,
  timezone               text not null default 'UTC',
  unit_system            public.unit_system not null default 'metric',

  -- Onboarding answers. Null until the flow completes.
  primary_goal           public.primary_goal,
  biological_sex         public.biological_sex,
  -- Birth year, not age: age would silently go stale. Onboarding asks for age
  -- (faster to answer) and converts before writing.
  -- Upper bound is a constant, not extract(year from now()): CHECK expressions
  -- must be IMMUTABLE, and now() is only STABLE. The real age bounds (13-100)
  -- are enforced in the domain layer, which is where they belong anyway.
  birth_year             integer check (birth_year between 1900 and 2100),
  height_cm              numeric(5,1) check (height_cm between 120 and 220),
  -- Snapshot only. Ongoing weight belongs in body_metrics (Milestone 6).
  starting_weight_kg     numeric(5,1) check (starting_weight_kg between 30 and 250),
  activity_level         public.activity_level,
  training_days_per_week smallint check (training_days_per_week between 0 and 7),
  focus                  text[] not null default '{}',

  onboarded_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on column public.profiles.focus is
  'Tracking pillars the user opted into: nutrition | hydration | sleep | training | recovery.';

-- ----------------------------------------------------------- user_targets ---
-- One row per recalculation, so history is preserved. The current target is the
-- most recent row — see public.current_targets below.
create table public.user_targets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  effective_from date not null default current_date,

  calorie_target integer not null check (calorie_target > 0),
  protein_g      integer not null check (protein_g >= 0),
  carbs_g        integer not null check (carbs_g >= 0),
  fat_g          integer not null check (fat_g >= 0),
  water_ml       integer not null check (water_ml > 0),
  sleep_minutes  integer not null check (sleep_minutes > 0),

  created_at     timestamptz not null default now(),

  -- One target set per user per day; recalculating twice in a day overwrites.
  unique (user_id, effective_from)
);

create index user_targets_user_effective_idx
  on public.user_targets (user_id, effective_from desc);

-- Convenience view: the currently active target for each user.
create view public.current_targets
with (security_invoker = true) as
  select distinct on (user_id) *
  from public.user_targets
  order by user_id, effective_from desc;

-- ================================ row level security ========================
alter table public.profiles     enable row level security;
alter table public.user_targets enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select using ((select auth.uid()) = id);

create policy "profiles are self-writable"
  on public.profiles for update using ((select auth.uid()) = id)
                             with check ((select auth.uid()) = id);

create policy "targets are self-readable"
  on public.user_targets for select using ((select auth.uid()) = user_id);

create policy "targets are self-writable"
  on public.user_targets for insert with check ((select auth.uid()) = user_id);

create policy "targets are self-updatable"
  on public.user_targets for update using ((select auth.uid()) = user_id)
                                 with check ((select auth.uid()) = user_id);

-- Note: no INSERT policy on profiles and no DELETE policy anywhere. Rows are
-- created by the trigger below, and account deletion cascades from auth.users.

-- ---------------------------------------------------------------- grants ---
-- RLS decides which ROWS a user may touch; grants decide whether the role may
-- touch the table at all. Both are required. Supabase's default privileges
-- would cover this, but stating it explicitly keeps the migration portable and
-- makes the intended access surface reviewable in one place.
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.user_targets to authenticated;
grant select on public.current_targets to authenticated;

-- ================================== triggers ================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- A profile row exists from the instant a user signs up, so the app never has to
-- handle "authenticated but no profile" as a special case.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================= complete_onboarding ==========================
-- Answers and derived targets commit together or not at all. A partial write
-- would leave a profile marked onboarded with no targets, a state every
-- dashboard would then have to defend against forever.
create or replace function public.complete_onboarding(
  p_primary_goal           public.primary_goal,
  p_biological_sex         public.biological_sex,
  p_birth_year             integer,
  p_height_cm              numeric,
  p_weight_kg              numeric,
  p_activity_level         public.activity_level,
  p_training_days_per_week integer,
  p_focus                  text[],
  p_unit_system            public.unit_system,
  p_calorie_target         integer,
  p_protein_g              integer,
  p_carbs_g                integer,
  p_fat_g                  integer,
  p_water_ml               integer,
  p_sleep_minutes          integer
)
returns void
language plpgsql
security invoker  -- runs as the caller, so RLS still applies
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.profiles set
    primary_goal           = p_primary_goal,
    biological_sex         = p_biological_sex,
    birth_year             = p_birth_year,
    height_cm              = p_height_cm,
    starting_weight_kg     = p_weight_kg,
    activity_level         = p_activity_level,
    training_days_per_week = p_training_days_per_week,
    focus                  = p_focus,
    unit_system            = p_unit_system,
    -- coalesce so re-running onboarding preserves the original completion date
    onboarded_at           = coalesce(onboarded_at, now())
  where id = v_user_id;

  -- Without this the UPDATE silently affects 0 rows when the profile is missing
  -- (a user created before this migration, or a failed handle_new_user trigger),
  -- the INSERT below still succeeds, and the function returns void. The app then
  -- shows the success summary, navigates to the dashboard, and the route guard
  -- bounces straight back to onboarding because onboarded_at was never set —
  -- an unbreakable loop with no error surfaced anywhere.
  if not found then
    raise exception 'profile row missing for user %', v_user_id
      using errcode = 'no_data_found';
  end if;

  insert into public.user_targets (
    user_id, effective_from, calorie_target, protein_g, carbs_g, fat_g, water_ml, sleep_minutes
  ) values (
    v_user_id, current_date, p_calorie_target, p_protein_g, p_carbs_g, p_fat_g, p_water_ml, p_sleep_minutes
  )
  on conflict (user_id, effective_from) do update set
    calorie_target = excluded.calorie_target,
    protein_g      = excluded.protein_g,
    carbs_g        = excluded.carbs_g,
    fat_g          = excluded.fat_g,
    water_ml       = excluded.water_ml,
    sleep_minutes  = excluded.sleep_minutes;
end;
$$;

-- Execute rights for the RPC. Granted across the schema rather than by explicit
-- signature so a future parameter change can't silently leave it ungranted.
grant execute on all functions in schema public to authenticated;
