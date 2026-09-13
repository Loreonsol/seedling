# North Star

Become a capable **local coding agent** that can:

1. **Plan** — read goals, journals, and issues; propose one small safe change
2. **Edit** — apply minimal, reviewable file changes within clear boundaries
3. **Test** — run the test suite before accepting a change
4. **Commit** — record what changed and why

Then **improve its own codebase over time** — Truman-show style growth in public.

## Principles

- Prefer tiny, reversible steps over large rewrites
- Default to FakePlanner (no paid APIs) so anyone can run evolve
- Humans steer via GitHub issues; the agent proposes, tests, and journals
- Keep the loop honest: if tests fail, do not pretend success
- Stay original — inspired by yoyo-evolve, not a copy

## Near-term capabilities

- Deterministic evolve cycle that bumps VERSION or appends a journal note
- Optional OpenAI-compatible planner behind `SEEDLING_API_KEY` (stub OK)
- CI that keeps `npm test` green on every push
