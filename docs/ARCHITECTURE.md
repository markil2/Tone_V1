# Architecture

## Layering

Clean Architecture applied per feature, with dependencies pointing inward only.

```
app/            Expo Router routes — thin, no logic
presentation/   screens, components, view-model hooks
domain/         entities, use-cases, repository PORTS   ← knows nothing about Supabase
data/           Supabase / HealthKit ADAPTERS, mappers  (per feature)
```

The shared Supabase client lives in `src/lib/supabase.ts`. Only per-feature
`data/` adapters may import it — ESLint enforces that.

The rule that matters: **`domain/` imports nothing from `data/`.** The domain
defines interfaces (`AuthRepository`); `data/` implements them
(`SupabaseAuthRepository`). This is what makes "add Apple Watch later" a *new
adapter* rather than a rewrite — the watch becomes another data source behind the
same port, and the UI is untouched.

Three deliberate concessions, so this doesn't become enterprise Java:

- **No DI container.** `src/app/container.ts` wires adapters to ports by hand.
  Explicit, typed, debuggable, and no reflection metadata to fight in a React
  Native bundle.
- **Use-cases only where there is real logic.** Plain reads go from a query hook
  straight to a repository.
- **`Result<T, E>` instead of thrown errors** across domain boundaries, so failure
  modes appear in type signatures.

## Data flow

```
Apple Watch ─┐
HealthKit    ├─→ sync adapter ─→ Supabase (raw logs, idempotent)
Manual entry ┘                        │
                                      ├─→ derived daily_summaries (read model)
                                      └─→ Edge Function → Claude → ai_insights
                                                                       │
                              TanStack Query ←────────────────────────┘
                                      ↓
                                     UI
```

Writes always go to Supabase first, never to a client store. The device is a
cache, not a source of truth — non-negotiable once a phone and a watch write
concurrently.

## State management

Four categories, each with the right tool:

| Kind | Tool | Example |
| --- | --- | --- |
| Server state | TanStack Query | logs, summaries, profile |
| Session | React Context over `onAuthStateChange` | `user`, `status` |
| Global client state | Zustand (small slices) | theme preference, onboarding draft |
| Local UI state | `useState` | form fields, sheet open/closed |

**Server data is never copied into Zustand.** That duplication is the largest
source of stale-data bugs, and a watch writing in the background guarantees it
bites.

Session lives in Context rather than Query because it is push-based — Supabase
drives it via token refresh and cross-device sign-out. Modelling it as a query
would mean fighting staleness rules for no benefit.

Screens don't call `useQuery` directly. Each feature exposes view-model hooks
(`useProfile`, `useOnboardingFlow`) returning `{ data, isLoading, error, actions }`.

## Navigation

Expo Router, with auth handled by **route groups, not conditional rendering**:

- `app/(auth)/_layout.tsx` → redirects out if a session exists
- `app/(app)/_layout.tsx` → redirects to sign-in if it doesn't, then to
  `/onboarding` if the profile isn't onboarded

Guarding at the *layout* level means every current and future screen inside a
group is protected by construction. Typed routes are on, so a typo'd path fails
at compile time.

Four tabs (`Today · Trends · Coach · Profile`) are the permanent shell. Every
future tracker opens as a modal or stack screen from Today, so the tab bar never
grows.

## Database

**Identity** — `auth.users` + `public.profiles` (1:1, created by trigger).

**Raw event logs** (M4+) — one table per domain, all sharing a spine:

```sql
id, user_id, occurred_at timestamptz, local_date date,
source text,        -- 'manual' | 'healthkit' | 'health_connect' | 'watch'
external_id text,   -- provider's UUID
UNIQUE (user_id, source, external_id)   -- makes sync idempotent
```

That unique constraint is the whole trick for health sync: re-importing the same
HealthKit sample becomes `ON CONFLICT DO NOTHING`, so a re-sync can never
double-count calories.

`local_date` is stored alongside `occurred_at` deliberately. "Sleep on Tuesday"
is a *user-timezone* question; deriving it at query time across DST and travel
produces wrong answers.

**Derived read models** — `daily_summaries` (one row per user per local date) and
`ai_insights`. Dashboards read one row instead of aggregating thousands.

RLS is enabled on every table from the first migration, policy
`user_id = auth.uid()`. The `service_role` key never ships to the client.

### Conventions

- Canonical SI in storage (cm, kg, ml, kJ). Imperial exists only at the
  presentation edge — see `src/shared/units`.
- Birth year, not age. Age would silently go stale; onboarding asks for age
  because it is faster to answer, and converts before writing.
- Derived targets live in `user_targets` with `effective_from`, so the AI layer
  can know which target was active on a given date.

## Onboarding

Seven steps, four sections, designed for under 60 seconds:

| Section | Steps |
| --- | --- |
| Goal | primary goal |
| About you | biological sex · age · height + weight |
| Activity | activity level · training days |
| Focus | pillars to track |

Design decisions that exist specifically to reduce drop-off:

- **Numeric answers are typed**, not dialled. A picker is fine for browsing a
  range, but slow when the user already knows the number — which they always do
  for their own age and weight.
- **Numeric answers are pre-filled** with population medians and selected on
  focus, so one keystroke replaces them. The default keeps the fast path without
  forcing a clear first.
- **Single-choice steps auto-advance** on tap — no Continue press.
- **Height and weight share a screen**; they are the same gesture twice.
- **Unit system is guessed from locale**, with the toggle directly above the
  picker.
- **The flow is one route**, not seven. The draft never touches the URL, back
  navigation can't strand a user mid-answer, and drop-off is one unit to
  instrument.
- **It ends on a summary** showing the targets derived from the answers. A flow
  that ends on an empty dashboard makes the questions feel extractive.

`NumberField` holds its text in local state rather than deriving it from the
numeric value on each keystroke — coercing as the user types makes backspacing
and decimal points fight the caret. Range errors surface on blur, never
mid-typing. A null value means "empty or out of range" and blocks Continue.

Imperial height uses two fields (ft, in) rather than a decimal foot value,
because nobody thinks of their height as 5.75 feet. Weight is displayed in
pounds but stored in kilograms; the domain and database only ever see SI.

Every question earns its place by changing something visible — each is an input
to `computeDailyTargets`. Questions that only satisfy curiosity cost conversion
and are excluded.

`computeDailyTargets` is pure and dependency-free, so the same numbers can be
produced on the watch, in an Edge Function, or in the AI pipeline. It uses
Mifflin-St Jeor, and clamps to an absolute calorie floor (1500 male / 1200
female) — surfacing the clamp to the user rather than silently serving a
different number.

Note that `trainingDaysPerWeek` deliberately does *not* feed the TDEE
calculation. Users pick an activity level that already accounts for training;
combining both systematically over-estimates. Training days drive hydration and
sleep targets instead.

## Milestones

| # | Milestone | Status |
| --- | --- | --- |
| 0 | Foundation — structure, design system, providers, routing | ✅ done |
| 1 | Supabase project, `profiles`, RLS, generated types | migration written, not applied |
| 2 | Auth end-to-end + onboarding | ✅ done |
| 3 | One vertical slice: Water | next |
| 4 | Logging kernel + `daily_summaries` + Today dashboard | |
| 5 | Nutrition, caffeine, electrolytes, supplements | |
| 6 | Body metrics, mood, energy; Trends + charts | |
| 7 | Workouts + strain | |
| 8 | HealthKit + Health Connect (`expo prebuild`, dev builds) | |
| 9 | Apple Watch — SwiftUI target, WatchConnectivity, complications | |
| 10 | AI insights — Edge Function → Claude, over `daily_summaries` | |
| 11 | Offline-first, notifications | |

M3 exists to be a throwaway-cheap proof of the architecture. If the pattern is
wrong, that surfaces in a day on Water, not in week six on Workouts.

## Risks

**Critical**

1. **Apple Watch is not an Expo feature.** A watchOS app is a separate SwiftUI
   Xcode target requiring `expo prebuild`, a custom config plugin, a paid Apple
   Developer account, and it *breaks Expo Go permanently*. Adopt development
   builds at M8, before daily work depends on Expo Go. Budget real Swift time.
2. **Health data is regulated PII.** RLS from migration one, no `service_role` in
   the client, no HealthKit data used for advertising (Apple forbids it), privacy
   policy and purpose strings required for review.
3. **Sync idempotency.** Without `UNIQUE(user_id, source, external_id)`,
   re-imports silently double-count. Users lose trust in a calorie number once.

**High**

4. Timezone / day boundaries — solved by storing `local_date` at write time.
5. Unit normalization — store SI, convert at the edge.
6. AI cost and privacy — never call the Anthropic API from the client; the key
   would ship in the bundle. Edge Function, over aggregated summaries, cached
   daily, advisory only.

**Medium**

7. **The project path contains a space** (`Safety Hackathon`), which breaks
   CocoaPods and Gradle. Must be fixed before M8.
8. **The enclosing git repo is `$HOME`.** Run `git init` here before committing.
9. `react`/`react-dom` are pinned via `overrides` — Expo SDK 57 pins react
   19.2.3 while react-dom floats to a version needing newer react. Revisit on SDK
   upgrade.
10. Offline conflict resolution — last-write-wins on `updated_at` is fine for
    logs; decide before M11.
