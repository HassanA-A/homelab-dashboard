# Fitness OS

Personal nutrition, strength and body-weight tracker. Next.js 15 (App Router) + Supabase + Tailwind v4.

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Design system, sidebar / bottom nav, dashboard | ✅ |
| 2 | Supabase auth, full schema (all phases), RLS | ✅ |
| 3 | Food diary, USDA + Open Food Facts search, manual foods, quick add, recents/favorites, copy day | ✅ |
| 4 | Barcode scanning ✅ · recipes, meal templates (schema only) | 🟡 |
| 5 | Weight logging, trend, 7-day avg, adaptive calorie recommendation | ✅ (measurements/photos: schema only) |
| 6 | Workout logging (schema + e1RM/volume math done) | ⏳ |
| 7 | Analytics, CSV export | ⏳ |

## Setup

1. Create a Supabase project. Run `supabase/migrations/*.sql`, then `supabase/seed.sql` (SQL editor, or `supabase db push`).
2. `cp .env.example .env.local` and fill in the Supabase URL + anon key. Get a free USDA key (DEMO_KEY is heavily rate limited).
3. `npm install && npm run dev`
4. Camera barcode scanning needs HTTPS (or `localhost`). Deploy to Vercel or use `next dev --experimental-https` to test on a phone.

`npm test` runs the domain-logic tests (macros, portions, adaptive TDEE, weight trend, e1RM, provider normalizers).

## Key design decisions

- **Nutrition snapshots.** Each `food_entries` row stores the food's name, serving basis and final macro totals. Editing a saved food or an upstream change never rewrites history. Editing an entry's amount rescales from its own snapshot.
- **Goals are versioned** by `effective_date`. Past days are judged against the targets that applied then.
- **Calories are the source of truth; carbs are derived.** 2,600 kcal / 140 P / 75 F → 341 g carbs (the original 330 g only added up to 2,555 kcal).
- **Adaptive maintenance** = avg intake on *complete* days − trend slope × 7,700 kcal/kg, over 21 days. It needs ≥10 weigh-in days and ≥10 days marked complete. Steps are capped at ±200 kcal, and nothing changes until you tap Apply.
- **Trend weight** is an EWMA (α = 0.1), so a single weigh-in moves it ~10% of the deviation. The 7-day average is shown as well.
- **Canonical units**: kg / cm in the database; lb or kg in the UI by profile setting.
- **Local dates.** `entry_date` / `local_date` come from the profile's timezone, so a late-night snack stays on the right day.
- **Idempotent writes.** The client sends a `client_request_id`; double-taps and retries can't duplicate entries.
- **RLS on every table.** Child tables carry `user_id` *and* check parent ownership on write. The built-in exercise library is shared read-only.
- **Set types.** `set_type` (warmup / working / drop / failure) replaces two booleans that allowed contradictory combinations.
