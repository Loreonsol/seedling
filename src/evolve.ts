import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyWithTestGate } from './applyChange.js';
import { FakePlanner } from './fakePlanner.js';
import { HttpPlanner } from './httpPlanner.js';
import { loadOpenIssues } from './loadIssues.js';
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
  const fake = new FakePlanner();
  const apiKey = process.env.SEEDLING_API_KEY;
  if (!apiKey) return fake;
  console.log('[evolve] SEEDLING_API_KEY set — using HttpPlanner (FakePlanner fallback)');
  return new HttpPlanner(apiKey, { fallback: fake });
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

  const openIssues = loadOpenIssues(ROOT);
  console.log('[evolve] open issues:\n' + openIssues);

  const ctx: PlannerContext = {
    northStar,
    latestJournal: latestJournal(ROOT),
    version: VERSION,
    rootDir: ROOT,
    openIssues,
  };

  const planner = createPlanner();
  const plan = await planner.propose(ctx);

  console.log('[evolve] plan:', plan.summary);
  console.log('[evolve] target:', plan.targetPath);

  // Clear boundary: only write the single planned file (no recursive tree walks).
  if (!plan.targetPath.startsWith(ROOT)) {
    throw new Error(`Refuse to write outside repo root: ${plan.targetPath}`);
  }

  console.log('[evolve] applying change to', plan.targetPath);
  const result = applyWithTestGate(plan.targetPath, plan.newContents, () => runTests(ROOT), ROOT);
  if (!result.ok) {
    console.error('[evolve] tests failed — restored previous contents');
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
