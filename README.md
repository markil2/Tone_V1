# Pulse

AI-powered fitness and recovery tracking for iOS, Android and (later) Apple Watch.

Built with Expo + TypeScript + Supabase, using Clean Architecture in a
feature-based structure. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the
design and the milestone plan.

> `Pulse` is a placeholder name. It appears in `app.json` (`name`, `slug`,
> `scheme`, bundle identifiers) and `package.json` — change all of them together.

## Getting started

```bash
npm install
cp .env.example .env      # fill in from your Supabase project's API settings
npm start
```

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run ios` / `android` / `web` | Open on a target |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, including architecture boundary rules |
| `npm run supabase:check` | Verify `.env`, connectivity, schema and RPC |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` |

## Database setup

Apply `supabase/migrations/0001_init.sql` to your project (Supabase SQL editor,
or `supabase db push`), then run `npm run db:types`. Until you do, the app builds
against a hand-written stub of the schema and any sign-in attempt will fail.

## Current state

Milestone 0 (foundation) and the onboarding flow are complete:

- Design system — tokens, theme, primitives
- Auth — email/password, secure session storage, route guards
- Onboarding — 7 steps, targets calculated from the answers
- Four-tab shell with placeholder screens

No tracking features yet. Those start with the Water vertical slice (M3).

## Layout

```
app/       Expo Router routes — thin, no logic
src/
  app/     composition root + providers
  core/    framework-agnostic: config, errors, Result, logger
  lib/     Supabase client, session storage adapters, generated types
  design-system/
  features/<name>/{domain,data,presentation}
  shared/  cross-feature utilities
supabase/migrations/
```

Two rules keep this from rotting, both enforced by ESLint:

1. Features are imported only through their barrel (`@/features/auth`), never
   by deep path.
2. Only repositories under `features/*/data/` may import the Supabase client.
