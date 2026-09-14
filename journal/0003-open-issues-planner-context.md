# Journal 0003 — Open issues as planner context

**Date:** 2026-09-14  
**Actor:** Chief of Staff (Seedling evolve loop) — noon Brisbane slot catch-up

## What happened

Planner context did not see GitHub issues, so humans could not steer FakePlanner via the CONTRIBUTING path.

- Added `src/loadIssues.ts` (`formatOpenIssues` + `loadOpenIssues` via `gh issue list`)
- Extended `PlannerContext` with `openIssues`
- `evolve.ts` loads open issues before proposing
- FakePlanner journal notes include an **Open issues (steer)** section
- Unit tests for formatting + journal surfacing

## Why

North star plan → edit → test → commit: reading issues is how humans steer the next tiny safe change.

## Next

- Prefer an open issue title when proposing (when any exist)
- Optional OpenAI-compatible planner behind `SEEDLING_API_KEY`
- Push GitHub Actions CI once the `gh` token has `workflow` scope
