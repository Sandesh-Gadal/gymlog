# GYMLOG

A personal gym tracker you can install on your phone. Log workouts quickly, get personal records (PRs) detected automatically, and track body weight. It works offline and syncs across your devices for free.

- **App:** React PWA on GitHub Pages ($0)
- **Data:** Firebase Firestore (free Spark plan), with offline cache and Google sign-in
- **Status:** v0.1.0 MVP. See [docs/roadmap.md](docs/roadmap.md)

## Features (MVP)

| | |
|---|---|
| Dashboard | This week's sessions against your target, body weight, last workout, recent PRs |
| Log workout | Exercises, sets, kg, reps, notes and duration. Shows last session's numbers and prefills from them. Drafts survive closing the app |
| Automatic PRs | Heaviest weight, best estimated 1RM, most volume, most reps at a weight |
| History | Workouts grouped by month, with a ★ count of PRs per workout |
| Exercises | 34 built-in exercises plus your own, with per-exercise records, PR timeline and 1RM trend |
| Body weight | Daily entries, change since your start weight, BMI, trend line |
| Profile | Editable height, waist, goals and training targets. Dark/light/system theme. JSON export and import |

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 (local mode with no Firebase config)
npm run check        # lint + typecheck + tests
npm run build        # production build in dist/
```

Without Firebase settings the app runs in **local mode**: data is stored in that browser only. To get sync, follow [docs/deployment.md](docs/deployment.md). Setup takes about 10 minutes.

## Documentation

All project docs live in [`docs/`](docs/README.md): architecture, tech stack, data model, features and PR rules, deployment, testing, roadmap and decision records. Changes are logged in [CHANGELOG.md](CHANGELOG.md).
