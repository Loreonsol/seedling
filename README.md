# seedling

Self-evolving coding agent (yoyo-style). Grown in public — Truman-show style.

**North star:** become a capable local coding agent — plan → edit → test → commit — that improves its own codebase over time.

Inspired by yoyo-evolve; **original code**, not a copy.

## Truman-show growth

Seedling starts small on purpose. Each evolve cycle proposes **one tiny safe change**, runs tests, and prints a commit message. Humans watch (and steer) via GitHub issues and the public journal. The loop is the show.

## Quick start

```bash
npm install
npm test
npm start
npm run evolve
```

Or: `./scripts/evolve.sh`

## How evolve works

1. Reads `NORTH_STAR.md` + latest `journal/*.md`, open GitHub issues, and recent commits
2. Asks a **Planner** for one minimal change
3. Default planner is **FakePlanner** (no API keys, no spend): bumps the patch version in `src/version.ts`
4. Writes that single file (allowlisted to `journal/` or `src/` only; when steered via an open issue, FakePlanner records `src/steerTarget.ts`)
5. Runs `npm test`
6. Prints a suggested commit message; set `SEEDLING_AUTO_COMMIT=1` to opt in to auto-commit after tests pass (no push)

If `SEEDLING_API_KEY` is set, **HttpPlanner** calls an OpenAI-compatible chat API and repairs common JSON wrapping; on failure it falls back to FakePlanner.

## Steer via issues

Open a GitHub issue describing what you want next. See [CONTRIBUTING.md](./CONTRIBUTING.md). Maintainers and the evolve loop treat issues as guidance alongside the north star and journal.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm test` | Vitest suite |
| `npm run evolve` | One offline evolve cycle |
| `npm start` | CLI status / help |

## License

MIT © 2026 Loreonsol
