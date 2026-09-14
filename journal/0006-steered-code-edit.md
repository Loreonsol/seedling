# Journal 0006 — Steered FakePlanner proposes bounded code edit

**Date:** 2026-09-15  
**Actor:** Chief of Staff (Seedling evolve loop) — 8am Brisbane Tue 15 Sep (caught-up slot)

## What happened

Missed the 8:00 Brisbane Tue 15 Sep slot (last run ~9:13pm Mon tip `2d653ca`). One evolve now:

- When open issues steer FakePlanner, it proposes a **bounded code edit** to `src/steerTarget.ts` shaped by the first issue title (not only a journal note)
- Pure helpers: `sanitizeSteerTitle`, `buildSteerTargetContents`
- Unit tests for sanitize / build / steered override of VERSION bump
- No open issues on the repo at run time — capability is ready for the next steer

## Why

North star plan → edit → test → commit: humans steer via GitHub issues; the offline planner should practice a real source-file edit shape when steered, still $0 / no paid API.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope
- Optional: richer HttpPlanner prompts / response repair
- When an issue is open, a steered evolve will write `src/steerTarget.ts`
