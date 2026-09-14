# Journal 0007 — HttpPlanner JSON response repair

**Date:** 2026-09-15  
**Actor:** Chief of Staff (Seedling evolve loop) — 8am Brisbane Tue 15 Sep

## What happened

- Added `extractJsonObject` so HttpPlanner can recover a Plan when the model wraps JSON in prose or fences
- `parsePlanJson` now uses that helper; system prompt tightened (journal/ or src/ only)
- Unit tests for prose-wrapped plans + README note that HttpPlanner is live behind `SEEDLING_API_KEY`
- Tests: 28 passed

## Why

North star plan → edit → test → commit: the optional paid-API planner path should tolerate common model wrapping instead of immediately falling back, while FakePlanner stays the $0 default.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope (local `.github/workflows/ci.yml` still untracked)
- When an issue is open, a steered evolve will write `src/steerTarget.ts`
- Optional: shared write allowlist enforced in `applyWithTestGate`
