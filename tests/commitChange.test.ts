import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { commitChange, shouldAutoCommit } from '../src/commitChange.js';

let dir: string | undefined;

afterEach(() => {
  if (dir) {
    rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  }
});

describe('shouldAutoCommit', () => {
  it('is off by default', () => {
    expect(shouldAutoCommit({})).toBe(false);
    expect(shouldAutoCommit({ SEEDLING_AUTO_COMMIT: '' })).toBe(false);
    expect(shouldAutoCommit({ SEEDLING_AUTO_COMMIT: '0' })).toBe(false);
    expect(shouldAutoCommit({ SEEDLING_AUTO_COMMIT: 'yes' })).toBe(false);
  });

  it('is on for 1 and true (case-insensitive)', () => {
    expect(shouldAutoCommit({ SEEDLING_AUTO_COMMIT: '1' })).toBe(true);
    expect(shouldAutoCommit({ SEEDLING_AUTO_COMMIT: 'true' })).toBe(true);
    expect(shouldAutoCommit({ SEEDLING_AUTO_COMMIT: 'TRUE' })).toBe(true);
    expect(shouldAutoCommit({ SEEDLING_AUTO_COMMIT: ' True ' })).toBe(true);
  });
});

describe('commitChange', () => {
  it('no-ops without running git when auto-commit is off', () => {
    dir = mkdtempSync(join(tmpdir(), 'seedling-commit-off-'));
    // Not a git repo — would fail if git ran
    const result = commitChange(dir, 'src/file.ts', 'evolve: test', {});
    expect(result).toEqual({ attempted: false, committed: false });
  });

  it('commits a file in a temp git repo when auto-commit is on', () => {
    dir = mkdtempSync(join(tmpdir(), 'seedling-commit-on-'));
    spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.email', 'seedling@test.local'], {
      cwd: dir,
      encoding: 'utf8',
    });
    spawnSync('git', ['config', 'user.name', 'Seedling Test'], {
      cwd: dir,
      encoding: 'utf8',
    });
    mkdirSync(join(dir, 'src'), { recursive: true });
    const target = join(dir, 'src', 'note.ts');
    writeFileSync(target, 'export const x = 1;\n', 'utf8');

    const result = commitChange(dir, target, 'evolve: auto-commit test', {
      SEEDLING_AUTO_COMMIT: '1',
      PATH: process.env.PATH,
      HOME: process.env.HOME,
    });

    expect(result.attempted).toBe(true);
    expect(result.committed).toBe(true);
    expect(result.message).toBe('evolve: auto-commit test');
    expect(result.error).toBeUndefined();
    expect(result.sha).toBeTruthy();
    expect(result.sha).toMatch(/^[0-9a-f]{7,40}$/i);

    const log = spawnSync('git', ['log', '-1', '--pretty=%s'], {
      cwd: dir,
      encoding: 'utf8',
    });
    expect(log.stdout.trim()).toBe('evolve: auto-commit test');
  });

  it('returns error without throwing when git fails', () => {
    dir = mkdtempSync(join(tmpdir(), 'seedling-commit-fail-'));
    // No git init — add/commit should fail
    const result = commitChange(dir, 'src/missing.ts', 'evolve: fail', {
      SEEDLING_AUTO_COMMIT: 'true',
      PATH: process.env.PATH,
      HOME: process.env.HOME,
    });
    expect(result.attempted).toBe(true);
    expect(result.committed).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
