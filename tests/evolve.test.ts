import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { FakePlanner } from '../src/fakePlanner.js';
import { VERSION } from '../src/version.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let tempRoot: string | undefined;

afterEach(() => {
  if (tempRoot) {
    rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = undefined;
  }
});

function makeTempRepo(journalNames: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'seedling-fake-'));
  mkdirSync(join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'journal'), { recursive: true });
  writeFileSync(join(dir, 'src', 'version.ts'), `export const VERSION = '${VERSION}';\n`, 'utf8');
  for (const name of journalNames) {
    writeFileSync(join(dir, 'journal', name), `# ${name}\n`, 'utf8');
  }
  return dir;
}

describe('VERSION', () => {
  it('is semver-ish (major.minor.patch)', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('FakePlanner', () => {
  it('bumps VERSION when journal count is even', async () => {
    tempRoot = makeTempRepo(['0000-a.md', '0001-b.md']);
    const planner = new FakePlanner();
    const plan = await planner.propose({
      northStar: 'test',
      latestJournal: 'test',
      version: VERSION,
      rootDir: tempRoot,
      openIssues: '(no open issues)',
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

  it('appends a journal note when journal count is odd', async () => {
    tempRoot = makeTempRepo(['0000-a.md']);
    const planner = new FakePlanner();
    const plan = await planner.propose({
      northStar: 'test',
      latestJournal: 'test',
      version: VERSION,
      rootDir: tempRoot,
      openIssues: '(no open issues)',
    });

    expect(plan.summary).toMatch(/Append journal note/);
    expect(plan.targetPath).toContain('journal');
    expect(plan.targetPath).toMatch(/0001-fake-evolve\.md$/);
    expect(plan.commitMessage).toMatch(/^evolve: append journal/);
    expect(plan.newContents).toMatch(/FakePlanner evolve note/);
    expect(plan.newContents).toMatch(/plan → edit → test → commit/);
  });


  it('surfaces open issues in journal notes', async () => {
    tempRoot = makeTempRepo(['0000-a.md']);
    const planner = new FakePlanner();
    const plan = await planner.propose({
      northStar: 'test',
      latestJournal: 'test',
      version: VERSION,
      rootDir: tempRoot,
      openIssues: '- #7: teach planner to prefer issue titles',
    });

    expect(plan.summary).toMatch(/Append journal note/);
    expect(plan.newContents).toMatch(/## Open issues \(steer\)/);
    expect(plan.newContents).toContain('#7: teach planner to prefer issue titles');
  });

  it('can parse the on-disk version.ts', () => {
    const text = readFileSync(join(root, 'src', 'version.ts'), 'utf8');
    expect(text).toContain(`VERSION = '${VERSION}'`);
  });
});
