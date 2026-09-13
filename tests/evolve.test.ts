import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FakePlanner } from '../src/fakePlanner.js';
import { VERSION } from '../src/version.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('VERSION', () => {
  it('is semver-ish (major.minor.patch)', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('FakePlanner', () => {
  it('returns a plan that bumps VERSION', async () => {
    const planner = new FakePlanner();
    const plan = await planner.propose({
      northStar: 'test',
      latestJournal: 'test',
      version: VERSION,
      rootDir: root,
    });

    expect(plan.summary).toMatch(/Bump VERSION/);
    expect(plan.targetPath).toContain('version.ts');
    expect(plan.commitMessage).toMatch(/^evolve:/);
    expect(plan.newContents).toMatch(/VERSION\s*=\s*'\d+\.\d+\.\d+'/);

    const match = plan.newContents.match(/VERSION\s*=\s*'(\d+)\.(\d+)\.(\d+)'/);
    expect(match).not.toBeNull();
    const [, , , patch] = match!;
    const currentPatch = VERSION.split('.')[2]!;
    expect(Number(patch)).toBe(Number(currentPatch) + 1);
  });

  it('can parse the on-disk version.ts', () => {
    const text = readFileSync(join(root, 'src', 'version.ts'), 'utf8');
    expect(text).toContain(`VERSION = '${VERSION}'`);
  });
});
