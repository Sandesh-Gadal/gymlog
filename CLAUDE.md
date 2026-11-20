# CLAUDE.md

Guidance for Claude Code (and humans) working in this repo.

## What this is
GYMLOG is a personal gym tracker PWA for a single user. It's local-first: Firestore offline cache plus sync, with no backend of our own. It's hosted for free on GitHub Pages. Keep it **simple and fast to log a workout**. Features are deliberately minimal; see `docs/roadmap.md` before adding any.

## Commands
- `npm run dev`: dev server. Runs in local mode unless `.env.local` has Firebase keys
- `npm run check`: lint (oxlint) + typecheck (tsc -b) + tests (vitest). **Run before saying work is done.**
- `npm test` / `npm run test:watch`: Vitest (jsdom)
- `npm run build`: production build plus service worker in `dist/`

## Architecture (read docs/architecture.md for detail)
- `src/lib/`: **pure domain logic, no React, no I/O**. `pr.ts` is the PR engine. All logic changes go here with unit tests.
- `src/data/`: the `Repository` interface (`repository.ts`), with `firestoreRepo.ts` (prod) and `localRepo.ts` (local mode and tests). UI code never imports Firebase directly.
- `src/state/`: `AuthContext` (Google sign-in or local user), `DataContext` (subscribes to the repo, derives PRs and records), `theme.ts`.
- `src/pages/`: one file per route. `src/components/`: shared UI.
- Routing uses **HashRouter** (GitHub Pages has no SPA fallback). Don't switch to BrowserRouter.

## Conventions
- TypeScript strict. Tailwind v4 with design tokens in `src/index.css` (`bg-surface`, `text-muted`, `text-accent`, …). Use the `card`, `btn-primary`, `btn-ghost`, `input` and `label` utilities rather than ad-hoc styles.
- Weights are stored in **kg**; dates are local `YYYY-MM-DD` strings.
- Built-in exercise IDs in `lib/exercises.ts` are stable slugs. **Never rename or remove one**, because stored workouts reference them.
- Repository writes must not wait for the server. Firestore promises only resolve once online (see `firestoreRepo.ts`).
- PRs are **derived, never stored**. They're recomputed from the workout history.
- Changing a stored shape (`lib/types.ts`) means updating `docs/data-model.md` and `lib/backup.ts` validation, and bumping the backup `version` if the change is breaking.

## Process
- Record notable choices as an ADR in `docs/decisions/` (copy `0000-template.md`, or run `/adr`).
- Add user-visible changes under `## [Unreleased]` in `CHANGELOG.md`.
- Keep the MVP scope. New features go through `docs/roadmap.md` first.
- Pushing to `main` deploys automatically via `.github/workflows/deploy.yml`.
