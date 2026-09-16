# Journal 0012 — Recent commits as planner context

**Date:** 2026-09-16  
**Actor:** Chief of Staff Seedling evolve loop — 9pm Brisbane Wed 16 Sep 2026

## What happened

Planner context already loaded open GitHub issues but not recent commits, so proposals could duplicate or ignore what just shipped.

- Added `src/loadCommits.ts` (`formatRecentCommits` + `loadRecentCommits` via `git log`)
- Extended `PlannerContext` with `recentCommits`
- `evolve.ts` loads and logs recent commits before proposing
- FakePlanner journal notes include a **Recent commits** section; HttpPlanner user prompt includes them too
- Unit tests for formatting, failure path, and a tiny temp git repo

## Why

North star plan → edit → test → commit: seeing what just landed keeps the next tiny safe change non-blind and non-duplicative, symmetric with open-issue steering.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope (local `.github/workflows/ci.yml` still untracked — CI still blocked)
- When an issue is open, steered evolve writes `src/steerTarget.ts`
