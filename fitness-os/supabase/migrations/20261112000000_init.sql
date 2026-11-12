-- Fitness OS — initial schema
-- Conventions:
--   * Every user-owned row carries user_id (indexed) and is protected by RLS on user_id = auth.uid().
--     Child tables also carry user_id so policies never need joins on read.
--   * Mass is stored canonically in kilograms, lengths in centimetres. Display units live in profiles.
--   * "Local date" columns (entry_date, local_date) are the user's calendar day, computed client-side
--     from their timezone, so an 11pm snack never lands on tomorrow.
--   * Food entries store a nutrition SNAPSHOT (final totals + basis). Editing or deleting a saved food,
--     or an upstream database change, never rewrites history.
--   * client_request_id lets the client retry a submit without creating duplicates.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles & goals
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  height_cm      numeric(5,1) check (height_cm between 50 and 260),
  date_of_birth  date,
  sex            text check (sex in ('male', 'female', 'other')),
  weight_unit    text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  length_unit    text not null default 'in' check (length_unit in ('in', 'cm')),
  timezone       text not null default 'America/New_York',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Goals are versioned by effective_date: the goal for day D is the latest row with effective_date <= D.
-- Changing targets never rewrites past adherence.
create table public.nutrition_goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  effective_date  date not null,
  goal_type       text not null check (goal_type in ('slight_deficit', 'maintenance', 'slight_surplus', 'moderate_surplus')),
  calories        integer not null check (calories between 800 and 8000),
  protein_g       numeric(6,1) not null check (protein_g >= 0),
  carbs_g         numeric(6,1) not null check (carbs_g >= 0),
  fat_g           numeric(6,1) not null check (fat_g >= 0),
  fiber_g         numeric(6,1) check (fiber_g >= 0),
  source          text not null default 'manual' check (source in ('manual', 'default', 'recommendation')),
  created_at      timestamptz not null default now(),
  unique (user_id, effective_date)
);
create index nutrition_goals_user_date on public.nutrition_goals (user_id, effective_date desc);

-- New user → profile + default lean-gain goal (2,600 kcal; 140P / 75F / carbs reconciled = 341C).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.nutrition_goals (user_id, effective_date, goal_type, calories, protein_g, carbs_g, fat_g, fiber_g, source)
  values (new.id, current_date, 'slight_surplus', 2600, 140, 341, 75, 30, 'default');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- nutrition
-- ---------------------------------------------------------------------------
-- The user's personal food library: custom foods, recipes, and external foods they have used/saved.
-- Nutrients are PER SERVING; serving_grams (when known) lets the UI scale to g/oz.
create table public.foods (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  source          text not null check (source in ('usda', 'off', 'custom', 'recipe')),
  external_id     text,
  barcode         text,
  name            text not null check (length(name) between 1 and 200),
  brand           text,
  serving_label   text not null default '1 serving',
  serving_grams   numeric(8,2) check (serving_grams > 0),
  calories        numeric(7,1) not null check (calories >= 0),
  protein_g       numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g         numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g           numeric(6,1) not null default 0 check (fat_g >= 0),
  fiber_g         numeric(6,1) check (fiber_g >= 0),
  confidence      text not null default 'user' check (confidence in ('verified', 'user', 'estimated')),
  notes           text,
  is_favorite     boolean not null default false,
  use_count       integer not null default 0,
  last_used_at    timestamptz,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- NULL external_ids are distinct, so custom foods never collide.
alter table public.foods add constraint foods_user_external unique (user_id, source, external_id);
create index foods_user_recent on public.foods (user_id, last_used_at desc nulls last);
create index foods_user_barcode on public.foods (user_id, barcode) where barcode is not null;
create trigger foods_updated_at before update on public.foods
  for each row execute function public.set_updated_at();

create table public.food_entries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  entry_date         date not null,
  meal               text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id            uuid references public.foods(id) on delete set null,
  -- snapshot of the food at time of logging
  food_name          text not null,
  brand              text,
  source             text not null check (source in ('usda', 'off', 'custom', 'recipe', 'quick')),
  confidence         text not null check (confidence in ('verified', 'user', 'estimated')),
  serving_label      text not null,
  serving_grams      numeric(8,2),
  -- what the user ate
  amount             numeric(8,2) not null check (amount > 0),
  unit               text not null check (unit in ('serving', 'g', 'oz')),
  -- final totals for this entry (already scaled)
  calories           numeric(7,1) not null check (calories >= 0),
  protein_g          numeric(6,1) not null check (protein_g >= 0),
  carbs_g            numeric(6,1) not null check (carbs_g >= 0),
  fat_g              numeric(6,1) not null check (fat_g >= 0),
  fiber_g            numeric(6,1),
  sort_order         integer not null default 0,
  client_request_id  uuid unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (unit = 'serving' or serving_grams is not null)
);
create index food_entries_user_date on public.food_entries (user_id, entry_date);
create index food_entries_food on public.food_entries (food_id);
create trigger food_entries_updated_at before update on public.food_entries
  for each row execute function public.set_updated_at();

-- Per-day metadata. is_complete matters: the adaptive maintenance estimate only trusts fully-logged days.
create table public.day_logs (
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null,
  is_complete  boolean not null default false,
  notes        text,
  updated_at   timestamptz not null default now(),
  primary key (user_id, log_date)
);
create trigger day_logs_updated_at before update on public.day_logs
  for each row execute function public.set_updated_at();

create table public.recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  servings    numeric(6,2) not null default 1 check (servings > 0),
  notes       text,
  -- the foods row that represents one serving of this recipe in the diary
  food_id     uuid references public.foods(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index recipes_user on public.recipes (user_id);
create trigger recipes_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id             uuid primary key default gen_random_uuid(),
  recipe_id      uuid not null references public.recipes(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  food_id        uuid references public.foods(id) on delete set null,
  food_name      text not null,
  serving_label  text not null,
  serving_grams  numeric(8,2),
  amount         numeric(8,2) not null check (amount > 0),
  unit           text not null check (unit in ('serving', 'g', 'oz')),
  calories       numeric(7,1) not null,
  protein_g      numeric(6,1) not null,
  carbs_g        numeric(6,1) not null,
  fat_g          numeric(6,1) not null,
  position       integer not null default 0
);
create index recipe_ingredients_recipe on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_user on public.recipe_ingredients (user_id);

create table public.meal_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  meal        text check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at  timestamptz not null default now()
);
create index meal_templates_user on public.meal_templates (user_id);

create table public.meal_template_items (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references public.meal_templates(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  food_id        uuid references public.foods(id) on delete set null,
  food_name      text not null,
  brand          text,
  source         text not null,
  confidence     text not null,
  serving_label  text not null,
  serving_grams  numeric(8,2),
  amount         numeric(8,2) not null check (amount > 0),
  unit           text not null check (unit in ('serving', 'g', 'oz')),
  calories       numeric(7,1) not null,
  protein_g      numeric(6,1) not null,
  carbs_g        numeric(6,1) not null,
  fat_g          numeric(6,1) not null,
  fiber_g        numeric(6,1),
  position       integer not null default 0
);
create index meal_template_items_template on public.meal_template_items (template_id);
create index meal_template_items_user on public.meal_template_items (user_id);

-- ---------------------------------------------------------------------------
-- body
-- ---------------------------------------------------------------------------
create table public.weight_entries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  weight_kg          numeric(6,3) not null check (weight_kg between 20 and 400),
  measured_at        timestamptz not null default now(),
  local_date         date not null,
  notes              text,
  client_request_id  uuid unique,
  created_at         timestamptz not null default now()
);
create index weight_entries_user_date on public.weight_entries (user_id, local_date);

create table public.body_measurements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('waist', 'chest', 'hips', 'neck', 'arm_left', 'arm_right', 'thigh_left', 'thigh_right', 'calf', 'body_fat_pct')),
  value        numeric(6,2) not null check (value > 0), -- cm, or % for body_fat_pct
  measured_at  timestamptz not null default now(),
  local_date   date not null,
  notes        text
);
create index body_measurements_user_kind_date on public.body_measurements (user_id, kind, local_date);

-- Photos live in a private Storage bucket; this row points at the object.
create table public.progress_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  storage_path  text not null,
  pose          text check (pose in ('front', 'side', 'back', 'other')),
  local_date    date not null,
  notes         text,
  created_at    timestamptz not null default now()
);
create index progress_photos_user_date on public.progress_photos (user_id, local_date);

create table public.activities (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  activity_type     text not null check (activity_type in ('steps', 'basketball', 'cardio', 'walk', 'run', 'cycling', 'sport', 'other')),
  activity_date     date not null,
  duration_minutes  integer check (duration_minutes between 0 and 1440),
  steps             integer check (steps >= 0),
  notes             text,
  created_at        timestamptz not null default now()
);
create index activities_user_date on public.activities (user_id, activity_date);

-- ---------------------------------------------------------------------------
-- training
-- ---------------------------------------------------------------------------
-- user_id NULL = built-in library exercise (readable by everyone, writable by no client).
create table public.exercises (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade,
  name               text not null,
  category           text not null check (category in ('compound', 'isolation', 'cardio', 'other')),
  primary_muscle     text not null,
  secondary_muscles  text[] not null default '{}',
  equipment          text,
  archived_at        timestamptz,
  created_at         timestamptz not null default now()
);
create unique index exercises_unique_name on public.exercises (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index exercises_user on public.exercises (user_id);

create table public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  notes       text,
  created_at  timestamptz not null default now()
);
create index routines_user on public.routines (user_id);

create table public.routine_exercises (
  id             uuid primary key default gen_random_uuid(),
  routine_id     uuid not null references public.routines(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  exercise_id    uuid not null references public.exercises(id),
  position       integer not null,
  target_sets    integer check (target_sets between 1 and 20),
  target_reps_low  integer,
  target_reps_high integer,
  rest_seconds   integer check (rest_seconds between 0 and 900)
);
create index routine_exercises_routine on public.routine_exercises (routine_id);
create index routine_exercises_user on public.routine_exercises (user_id);
create index routine_exercises_exercise on public.routine_exercises (exercise_id);

create table public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  routine_id    uuid references public.routines(id) on delete set null,
  name          text not null,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  local_date    date not null,
  notes         text,
  check (completed_at is null or completed_at >= started_at)
);
create index workouts_user_date on public.workouts (user_id, local_date desc);
create index workouts_routine on public.workouts (routine_id);

create table public.workout_exercises (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references public.workouts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id),
  position     integer not null,
  notes        text
);
create index workout_exercises_workout on public.workout_exercises (workout_id);
create index workout_exercises_user_exercise on public.workout_exercises (user_id, exercise_id);
create index workout_exercises_exercise on public.workout_exercises (exercise_id);

-- One row per set. set_type replaces separate is_warmup/is_failure booleans (which allowed
-- contradictory combos). Failure is also expressible as rir = 0.
create table public.workout_sets (
  id                   uuid primary key default gen_random_uuid(),
  workout_exercise_id  uuid not null references public.workout_exercises(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  set_number           integer not null check (set_number >= 1),
  set_type             text not null default 'working' check (set_type in ('warmup', 'working', 'drop', 'failure')),
  weight_kg            numeric(7,3) check (weight_kg >= 0),
  reps                 integer check (reps between 0 and 200),
  rir                  numeric(3,1) check (rir between 0 and 10),
  completed_at         timestamptz,
  client_request_id    uuid unique,
  unique (workout_exercise_id, set_number)
);
create index workout_sets_user on public.workout_sets (user_id);
create index workout_sets_workout_exercise on public.workout_sets (workout_exercise_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.nutrition_goals      enable row level security;
alter table public.foods                enable row level security;
alter table public.food_entries         enable row level security;
alter table public.day_logs             enable row level security;
alter table public.recipes              enable row level security;
alter table public.recipe_ingredients   enable row level security;
alter table public.meal_templates       enable row level security;
alter table public.meal_template_items  enable row level security;
alter table public.weight_entries       enable row level security;
alter table public.body_measurements    enable row level security;
alter table public.progress_photos      enable row level security;
alter table public.activities           enable row level security;
alter table public.exercises            enable row level security;
alter table public.routines             enable row level security;
alter table public.routine_exercises    enable row level security;
alter table public.workouts             enable row level security;
alter table public.workout_exercises    enable row level security;
alter table public.workout_sets         enable row level security;

-- profiles: keyed on id
create policy "own profile select" on public.profiles for select using (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Simple owner-only tables: one policy per command.
do $$
declare t text;
begin
  foreach t in array array[
    'nutrition_goals', 'foods', 'food_entries', 'day_logs', 'recipes', 'meal_templates',
    'weight_entries', 'body_measurements', 'progress_photos', 'activities', 'routines', 'workouts'
  ] loop
    execute format('create policy "own select" on public.%I for select using (user_id = (select auth.uid()))', t);
    execute format('create policy "own insert" on public.%I for insert with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own update" on public.%I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own delete" on public.%I for delete using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Child tables: user_id must match AND the parent must belong to the same user (prevents
-- attaching rows to someone else's workout/recipe by guessing an id).
create policy "own select" on public.recipe_ingredients for select using (user_id = (select auth.uid()));
create policy "own delete" on public.recipe_ingredients for delete using (user_id = (select auth.uid()));
create policy "own insert" on public.recipe_ingredients for insert with check (
  user_id = (select auth.uid()) and exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = (select auth.uid())));
create policy "own update" on public.recipe_ingredients for update using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = (select auth.uid())));

create policy "own select" on public.meal_template_items for select using (user_id = (select auth.uid()));
create policy "own delete" on public.meal_template_items for delete using (user_id = (select auth.uid()));
create policy "own insert" on public.meal_template_items for insert with check (
  user_id = (select auth.uid()) and exists (select 1 from public.meal_templates m where m.id = template_id and m.user_id = (select auth.uid())));
create policy "own update" on public.meal_template_items for update using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.meal_templates m where m.id = template_id and m.user_id = (select auth.uid())));

create policy "own select" on public.routine_exercises for select using (user_id = (select auth.uid()));
create policy "own delete" on public.routine_exercises for delete using (user_id = (select auth.uid()));
create policy "own insert" on public.routine_exercises for insert with check (
  user_id = (select auth.uid()) and exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())));
create policy "own update" on public.routine_exercises for update using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())));

create policy "own select" on public.workout_exercises for select using (user_id = (select auth.uid()));
create policy "own delete" on public.workout_exercises for delete using (user_id = (select auth.uid()));
create policy "own insert" on public.workout_exercises for insert with check (
  user_id = (select auth.uid()) and exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())));
create policy "own update" on public.workout_exercises for update using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())));

create policy "own select" on public.workout_sets for select using (user_id = (select auth.uid()));
create policy "own delete" on public.workout_sets for delete using (user_id = (select auth.uid()));
create policy "own insert" on public.workout_sets for insert with check (
  user_id = (select auth.uid()) and exists (select 1 from public.workout_exercises we where we.id = workout_exercise_id and we.user_id = (select auth.uid())));
create policy "own update" on public.workout_sets for update using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.workout_exercises we where we.id = workout_exercise_id and we.user_id = (select auth.uid())));

-- exercises: built-ins readable by all signed-in users; custom ones are private.
create policy "read library and own" on public.exercises for select
  using (user_id is null or user_id = (select auth.uid()));
create policy "own insert" on public.exercises for insert with check (user_id = (select auth.uid()));
create policy "own update" on public.exercises for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own delete" on public.exercises for delete using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RPCs (run as the caller, so RLS still applies)
-- ---------------------------------------------------------------------------
-- Copy every entry from one meal/day to another in a single transaction.
create or replace function public.copy_meal(p_from_date date, p_to_date date, p_from_meal text default null, p_to_meal text default null)
returns integer language plpgsql security invoker set search_path = public as $$
declare n integer;
begin
  insert into food_entries (user_id, entry_date, meal, food_id, food_name, brand, source, confidence,
    serving_label, serving_grams, amount, unit, calories, protein_g, carbs_g, fat_g, fiber_g, sort_order)
  select user_id, p_to_date, coalesce(p_to_meal, meal), food_id, food_name, brand, source, confidence,
    serving_label, serving_grams, amount, unit, calories, protein_g, carbs_g, fat_g, fiber_g, sort_order
  from food_entries
  where user_id = auth.uid() and entry_date = p_from_date and (p_from_meal is null or meal = p_from_meal);
  get diagnostics n = row_count;
  return n;
end $$;

-- Daily totals used by dashboard/analytics.
create or replace view public.daily_nutrition with (security_invoker = true) as
select user_id, entry_date,
  sum(calories)::numeric(8,1)  as calories,
  sum(protein_g)::numeric(7,1) as protein_g,
  sum(carbs_g)::numeric(7,1)   as carbs_g,
  sum(fat_g)::numeric(7,1)     as fat_g,
  count(*)                     as entry_count
from public.food_entries
group by user_id, entry_date;
