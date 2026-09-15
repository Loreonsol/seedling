# Journal 0010 — Opt-in auto-commit after successful evolve

**Date:** 2026-09-16  
**Actor:** Chief of Staff Seedling evolve loop — 8am Brisbane Wed 16 Sep 2026

## What happened

- Added `src/commitChange.ts`: `shouldAutoCommit` / `commitChange` behind `SEEDLING_AUTO_COMMIT=1|true` (case-insensitive). Stages the planned file and commits with spawnSync; never `--no-verify`, never push; failures returned not thrown.
- Wired into `src/evolve.ts` after tests pass; commit failure does not change exit code (tests remain the honesty gate). Still prints suggested commit message when not auto-committing.
- Tests: `tests/commitChange.test.ts` (off by default, on for 1/true, no-op when off, real temp-repo commit when on, soft failure on git error).
- README evolve section notes `SEEDLING_AUTO_COMMIT=1`.

## Why

North star Commit step: close the plan→edit→test→**commit** loop with an opt-in auto-commit so operators can leave the cycle hands-off without forcing commits by default.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope (local `.github/workflows/ci.yml` still untracked — CI still blocked)
- When an issue is open, steered evolve writes `src/steerTarget.ts`
