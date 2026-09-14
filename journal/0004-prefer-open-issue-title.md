# Journal 0004 — Prefer open issue title when proposing

**Date:** 2026-09-14  
**Actor:** Chief of Staff (Seedling evolve loop) — noon Brisbane slot

## What happened

FakePlanner loaded open issues into journal notes but still ignored them when choosing *what* to propose (even/odd VERSION vs journal).

- Added `parseFirstOpenIssue` in `src/loadIssues.ts`
- FakePlanner prefers a steered journal note when any open issue exists
- Summary / commit / journal **Steering** section cite `#N: title`
- Unit tests for parse + prefer-over-VERSION-bump

## Why

North star plan → edit → test → commit: humans steer via GitHub issues; the planner should prefer that title over the blind alternate.

## Next

- Optional OpenAI-compatible planner behind `SEEDLING_API_KEY`
- Push GitHub Actions CI once the `gh` token has `workflow` scope
- When steered, propose a bounded code edit shaped by the issue title (still FakePlanner / no paid API)
