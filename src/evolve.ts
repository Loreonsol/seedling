import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakePlanner } from './fakePlanner.js';
import type { Planner, PlannerContext } from './types.js';
import { VERSION } from './version.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function latestJournal(root: string): string {
  const dir = join(root, 'journal');
  if (!existsSync(dir)) return '(no journal yet)';
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
  if (files.length === 0) return '(no journal yet)';
  return readFileSync(join(dir, files[files.length - 1]!), 'utf8');
}

function createPlanner(): Planner {
  // Optional real OpenAI-compatible planner — stub behind SEEDLING_API_KEY.
  // TODO: implement OpenAI-compatible HTTP planner when key is set.
  if (process.env.SEEDLING_API_KEY) {
    console.log(
      '[evolve] SEEDLING_API_KEY set — real planner stub not implemented yet; using FakePlanner',
    );
  }
  return new FakePlanner();
}

function runTests(root: string): boolean {
  console.log('[evolve] running npm test …');
  const result = spawnSync('npm', ['test'], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
    env: { ...process.env, SEEDLING_EVOLVE_SKIP_NESTED: '1' },
  });
  return result.status === 0;
}

async function evolve(): Promise<void> {
  // Avoid infinite nested test → evolve → test when evolve itself runs tests.
  if (process.env.SEEDLING_EVOLVE_SKIP_NESTED === '1') {
    console.log('[evolve] nested invoke skipped');
    return;
  }

  const northStarPath = join(ROOT, 'NORTH_STAR.md');
  const northStar = existsSync(northStarPath)
    ? readFileSync(northStarPath, 'utf8')
    : '(missing NORTH_STAR.md)';

  const ctx: PlannerContext = {
    northStar,
    latestJournal: latestJournal(ROOT),
    version: VERSION,
    rootDir: ROOT,
  };

  const planner = createPlanner();
  const plan = await planner.propose(ctx);

  console.log('[evolve] plan:', plan.summary);
  console.log('[evolve] target:', plan.targetPath);

  // Clear boundary: only write the single planned file (no recursive tree walks).
  if (!plan.targetPath.startsWith(ROOT)) {
    throw new Error(`Refuse to write outside repo root: ${plan.targetPath}`);
  }
  writeFileSync(plan.targetPath, plan.newContents, 'utf8');
  console.log('[evolve] applied change to', plan.targetPath);

  const ok = runTests(ROOT);
  if (!ok) {
    console.error('[evolve] tests failed — leaving change in place for inspection');
    process.exitCode = 1;
    return;
  }

  console.log('[evolve] tests passed');
  console.log('[evolve] suggested commit message:');
  console.log(plan.commitMessage);
}

evolve().catch((err) => {
  console.error('[evolve] fatal:', err);
  process.exitCode = 1;
});
