# Journal 0008 — Shared write allowlist (journal/|src/)

**Date:** 2026-09-15  
**Actor:** Chief of Staff (Seedling evolve loop) — noon Brisbane Tue 15 Sep

## What happened

- Added `src/writeAllowlist.ts` with `isAllowedWritePath` / `assertAllowedWritePath`
- `applyWithTestGate` now requires `rootDir` and refuses writes outside `journal/` or `src/` before touching disk
- `HttpPlanner.parsePlanJson` enforces the same allowlist after path resolve
- Tests: 32 passed (was 28)

## Why

North star edit boundary: the apply gate (not just planner prompts) should hard-block accidental writes to README, package files, or escapes. Tiny reversible step toward a safer local coding agent.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope (local `.github/workflows/ci.yml` still untracked)
- When an issue is open, a steered evolve will write `src/steerTarget.ts`
- Optional: surface allowlist refusal in evolve CLI exit messaging more clearly
