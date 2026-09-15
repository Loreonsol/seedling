# Journal 0009 — Clearer evolve CLI allowlist refusal messaging

**Date:** 2026-09-15  
**Actor:** Chief of Staff (Seedling evolve loop) — 9pm Brisbane Tue 15 Sep 2026

## What happened

- Tried to land `.github/workflows/ci.yml` first; `git push` rejected (OAuth App lacks `workflow` scope). Reverted that commit; local `ci.yml` remains untracked for a later unlock.
- Fallback: `formatEvolveRefusal` in `src/writeAllowlist.ts`; `evolve.ts` catch prints `[evolve] refused: …` (no fatal stack) for allowlist / outside-repo-root refusals and sets `process.exitCode = 1`.
- Tests: 35 passed (was 32); added `tests/evolveRefusal.test.ts` (3 cases) without nesting evolve.

## Why

Journal 0008 next-item: surface allowlist refusal in evolve CLI exit messaging more clearly. CI remains blocked on token scope.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope (local `.github/workflows/ci.yml` still untracked)
- When an issue is open, steered evolve writes `src/steerTarget.ts`
