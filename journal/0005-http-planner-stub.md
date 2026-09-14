# Journal 0005 — HttpPlanner behind SEEDLING_API_KEY

**Date:** 2026-09-14  
**Actor:** Chief of Staff (Seedling evolve loop) — 9pm Brisbane slot

## What happened

North star near-term called for an optional OpenAI-compatible planner. Wired a real (still free-default) path:

- Added `src/httpPlanner.ts` — `HttpPlanner` calls chat completions, parses JSON Plan, rejects path escapes
- Pure helpers: `parsePlanJson`, `extractAssistantContent`, `resolveTargetPath`
- `createPlanner()` uses HttpPlanner when `SEEDLING_API_KEY` is set, with FakePlanner fallback on API failure
- Unit tests with mocked fetch (no network, no spend)
- Index status line mentions the env switch

## Why

Plan → edit → test → commit growth: FakePlanner stays the $0 default; optional key unlocks a real planner without locking the loop to paid APIs.

## Next

- When steered, propose a bounded code edit shaped by the issue title (FakePlanner / no paid API)
- Push GitHub Actions CI once the `gh` token has `workflow` scope
- Optional: richer HttpPlanner prompts / response repair
