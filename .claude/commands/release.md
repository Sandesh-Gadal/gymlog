---
description: Cut a release (bump the version, finalise the changelog, tag)
argument-hint: <patch|minor|major>
---
Release type: $ARGUMENTS (default: minor)

1. `npm run check && npm run build` must pass.
2. Bump the version in `package.json` with `npm version $ARGUMENTS --no-git-tag-version`.
3. In `CHANGELOG.md`, move `## [Unreleased]` items under a new `## [x.y.z] - YYYY-MM-DD` heading, leave an empty Unreleased section, and update the compare links.
4. Show me the diff and ask before committing, tagging (`vX.Y.Z`) or pushing. Pushing to main deploys.
