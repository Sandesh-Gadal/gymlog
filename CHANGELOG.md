# Changelog

All notable changes to GYMLOG are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Dashboard activity heatmap: a GitHub-style grid of the last 26 weeks, shaded by each day's training volume.
- Weekly planner (`/plan`, also linked from Profile and the Dashboard): named sessions with set and rep targets, a Monday to Sunday schedule with rest days, and daily items such as mobility. A one-tap Push / Pull / Legs template is included.
- Logging starts from the plan: "Start Push" fills in the exercises with planned sets, last weights and rep targets, and shows the session notes. Rest days offer "Start mobility".
- Dashboard week strip shows each day's planned session, and the weekly target follows the plan.
- Built-in exercises: Hammer Curl, Overhead Triceps Extension, Shoulder Pass-through (mobility).
- Backups include the weekly plan. Older backups without one still import.
- Checklist logging: tick ✓ to complete each set, or "✓ All" per exercise. Only ticked sets are saved. Shows a progress bar of sets done.
- Rest timer: starts when you tick a set, with −15 / +15 s (remembered as your default) and Skip. Vibrates at the end where supported.
- Streaks: days in a row and weeks on target, shown on the Dashboard.
- Achievements page with 23 badges (milestones, streaks, PRs, volume such as 🐘 Elephant for 6,000 kg in one workout, body weight). New badges are announced when you save a workout.

### Changed
- Planned sets are prefilled with last session's reps (or the bottom of the rep range), ready to tick.

## [0.1.0] - 2026-11-21

First MVP.

### Added
- Installable PWA (manifest, icons, offline service worker), mobile-first layout with bottom navigation.
- Google sign-in with Firebase. Data in Firestore with an offline cache and sync across devices.
- Local mode when Firebase isn't configured: data stays in browser localStorage.
- Dashboard: this week's sessions against your target, body weight, last workout, recent PRs.
- Workout logging: exercises, sets (kg × reps), notes, date and duration (filled in automatically from elapsed time). Shows "last time" values and prefills from them. Drafts are saved if the app closes.
- Automatic PR detection: heaviest weight, estimated 1RM (Epley), most volume, most reps at a weight.
- Workout history grouped by month, workout detail view, edit and delete.
- Exercise library: 31 built-ins plus custom exercises, with per-exercise records, PR timeline and 1RM trend line.
- Body weight log: one entry per day, change since start weight, BMI, trend line.
- Editable profile (height, waist, start weight, days per week, session length, goals).
- Dark, light and system themes.
- JSON backup export and import with validation.
- Docs (architecture, data model, deployment, testing, roadmap, ADRs), CI and GitHub Pages deploy workflow, Firestore security rules.

[Unreleased]: https://github.com/OWNER/gymlog/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/OWNER/gymlog/releases/tag/v0.1.0
