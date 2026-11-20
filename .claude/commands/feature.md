---
description: Implement a roadmap feature end to end (code, tests, docs, changelog)
argument-hint: <feature from docs/roadmap.md>
---
Implement: $ARGUMENTS

1. Read `CLAUDE.md`, `docs/roadmap.md`, `docs/architecture.md` and `docs/data-model.md`. Confirm the feature is on the roadmap, and keep it as small as the roadmap item describes.
2. Put domain logic in `src/lib/` with unit tests. Do storage through the `Repository` interface only. New collections go under `users/{uid}/…`, so update `lib/types.ts`, `CollectionName`, `lib/backup.ts` validation and `firestore.rules` if needed.
3. Build the UI with the existing utilities (`card`, `btn-primary`, `input`, …), mobile-first, and check it works in both themes.
4. Update `docs/features.md`, `docs/data-model.md` (if the schema changed), tick the item in `docs/roadmap.md`, and add an entry under `## [Unreleased]` in `CHANGELOG.md`.
5. Run `npm run check` and `npm run build`. Both must pass.
