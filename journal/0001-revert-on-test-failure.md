# Journal 0001 — Revert on test failure

**Date:** 2026-09-13  
**Actor:** Chief of Staff (Seedling evolve loop)

## What happened

Evolve used to leave a failed edit on disk for inspection. That fights the north star (“if tests fail, do not pretend success”).

- Added `src/applyChange.ts` with `applyWithTestGate`
- Wired `evolve.ts` to restore previous file contents when `npm test` fails
- Added unit tests for keep-on-pass / restore-on-fail

## Why

Honest plan → edit → test → commit: a red suite means the change did not land.

## Next

- Push GitHub Actions CI once the `gh` token has `workflow` scope (file already drafted locally under `.github/workflows/ci.yml`)
- Optional OpenAI-compatible planner behind `SEEDLING_API_KEY`
- FakePlanner alternate: append a journal note, not only VERSION bumps
