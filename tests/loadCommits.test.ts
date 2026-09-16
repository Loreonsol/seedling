import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import {
  formatRecentCommits,
  loadRecentCommits,
} from '../src/loadCommits.js';

describe('formatRecentCommits', () => {
  it('returns placeholder when empty', () => {
    expect(formatRecentCommits([])).toBe('(no recent commits)');
  });

  it('formats short sha and subject as a markdown list', () => {
    expect(
      formatRecentCommits([
        {
          sha: '47a1301abcdef0123456789abcdef0123456789',
          subject: 'evolve: report commit SHA after auto-commit',
        },
        { sha: '6e49e2f', subject: 'evolve: opt-in auto-commit' },
      ]),
    ).toBe(
      '- 47a1301: evolve: report commit SHA after auto-commit\n- 6e49e2f: evolve: opt-in auto-commit',
    );
  });
});

describe('loadRecentCommits', () => {
  let tempRoot: string | undefined;

  afterEach(() => {
    if (tempRoot) {
      rmSync(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  it('returns placeholder when not a git repo', () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'seedling-nocommits-'));
    expect(loadRecentCommits(tempRoot)).toBe('(no recent commits)');
  });

  it('loads commits from a tiny temp git repo', () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'seedling-commits-'));
    const run = (args: string[]) => {
      const r = spawnSync('git', args, {
        cwd: tempRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: 'test',
          GIT_AUTHOR_EMAIL: 'test@example.com',
          GIT_COMMITTER_NAME: 'test',
          GIT_COMMITTER_EMAIL: 'test@example.com',
        },
      });
      expect(r.status).toBe(0);
    };
    run(['init']);
    writeFileSync(join(tempRoot!, 'a.txt'), 'a\n');
    run(['add', 'a.txt']);
    run(['commit', '-m', 'first commit']);
    writeFileSync(join(tempRoot!, 'b.txt'), 'b\n');
    run(['add', 'b.txt']);
    run(['commit', '-m', 'second commit']);

    const out = loadRecentCommits(tempRoot!, 2);
    expect(out).not.toBe('(no recent commits)');
    expect(out).toMatch(/^- [0-9a-f]{7}: second commit$/m);
    expect(out).toMatch(/^- [0-9a-f]{7}: first commit$/m);
  });
});
