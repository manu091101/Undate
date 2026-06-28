# Contributing to Lumin

Welcome. This document covers the rules of the road for the founding team.

## Branching

- `main` is always deployable. Protected; merges only via PR.
- Feature branches: `feat/<short-slug>` — e.g. `feat/onboarding-personality-scoring`.
- Bug fixes: `fix/<short-slug>`.
- Chores: `chore/<short-slug>`.
- One concern per branch. Keep diffs reviewable (< ~400 lines is ideal).

## Commits — conventional commits

We follow [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <subject>

<body, optional, wrapped at 72>

<footer, optional — BREAKING CHANGE, refs, etc.>
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `revert`.

Scopes match package or app names: `web`, `admin`, `mobile`, `api`, `db`, `ui`, `shared`, `ai`, `infra`, `config`.

Examples:
- `feat(matches): add daily curation scheduler`
- `fix(api): correct refresh-token rotation race`
- `chore(deps): bump prisma to 6.0.1`

## Pull requests

Every PR must:
1. Link the related issue or note "no issue — see description".
2. Pass CI (lint, typecheck, test, build).
3. Include screenshots/recordings for any UI change.
4. Update docs when touching architecture or public APIs.
5. Have at least one approval. Security-touching code requires two.

PR title follows the same conventional-commits format as commits. We squash-merge — the PR title becomes the commit on `main`.

## Code style

- TypeScript is strict; no `any` without a justifying comment.
- Run `pnpm format` before pushing.
- Prefer named exports.
- Keep files under ~500 lines; refactor when growing past that.
- Domain logic lives in services; controllers/resolvers are thin.
- Tests live next to the code they cover (`*.test.ts`) or in `__tests__/` for larger fixtures.

## Testing

- Unit tests for pure logic (Vitest or Jest depending on package).
- API: integration tests against an ephemeral Postgres (test container).
- Web/mobile: critical-path Playwright/Maestro flows. Snapshot tests sparingly.
- Aim for meaningful coverage, not a number. Cover branches that would embarrass us if broken.

## Reviewing

Be specific. Suggest, don't gatekeep. Approve when you'd be comfortable shipping the change yourself.

## Environment hygiene

- Never commit `.env*` files (except `.env.example`).
- Never log PII (phone numbers, emails, photos, geolocation). Use the `redacted()` helper in `@lumin/shared`.
- New env vars must be added to `.env.example` in the same PR.

## Releases

`main` is continuously deployed to staging. Production deploys are tag-driven (`v0.x.y`). Use `pnpm changeset` for release notes once Phase 2 begins.
