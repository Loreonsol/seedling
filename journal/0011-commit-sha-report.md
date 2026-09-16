# Journal 0011 — Report commit SHA after auto-commit

**Date:** 2026-09-16  
**Actor:** Chief of Staff Seedling evolve loop — noon Brisbane Wed 16 Sep 2026

## What happened

- Extended `CommitResult` with optional `sha?: string`. On successful auto-commit, `commitChange` runs `git rev-parse HEAD` and sets `sha` to the trimmed hex when valid (7–40 chars); if rev-parse fails, still returns `committed: true` without `sha`.
- `evolve.ts` logs `[evolve] committed: <message> (<sha>)` when a SHA is present, so the north-star Commit step is observable.
- Happy-path test in `tests/commitChange.test.ts` asserts `sha` matches `/^[0-9a-f]{7,40}$/i`.

## Why

Opt-in auto-commit already closes the loop; surfacing the SHA makes the Commit step auditable without digs into `git log`.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope (local `.github/workflows/ci.yml` still untracked — CI still blocked)
- When an issue is open, steered evolve writes `src/steerTarget.ts`
