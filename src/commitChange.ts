import { spawnSync } from 'node:child_process';
import { relative, resolve } from 'node:path';

export type CommitResult = {
  attempted: boolean;
  committed: boolean;
  message?: string;
  error?: string;
};

/**
 * Opt-in auto-commit after a successful evolve cycle.
 * Enabled only when SEEDLING_AUTO_COMMIT is "1" or "true" (case-insensitive).
 */
export function shouldAutoCommit(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.SEEDLING_AUTO_COMMIT;
  if (raw == null) return false;
  const v = String(raw).trim().toLowerCase();
  return v === '1' || v === 'true';
}

/**
 * Stage one path and commit with the given message when auto-commit is enabled.
 * Never uses --no-verify or force flags; never pushes. Failures are returned, not thrown.
 */
export function commitChange(
  rootDir: string,
  targetPath: string,
  commitMessage: string,
  env: NodeJS.ProcessEnv = process.env,
): CommitResult {
  if (!shouldAutoCommit(env)) {
    return { attempted: false, committed: false };
  }

  const abs = resolve(rootDir, targetPath);
  const rel = relative(rootDir, abs);
  const pathArg = rel.length > 0 ? rel : abs;

  const add = spawnSync('git', ['add', '--', pathArg], {
    cwd: rootDir,
    encoding: 'utf8',
    env,
  });
  if (add.status !== 0) {
    const error = (add.stderr || add.stdout || `git add failed (status ${add.status})`).trim();
    return { attempted: true, committed: false, error };
  }

  const commit = spawnSync('git', ['commit', '-m', commitMessage], {
    cwd: rootDir,
    encoding: 'utf8',
    env,
  });
  if (commit.status !== 0) {
    const error = (
      commit.stderr ||
      commit.stdout ||
      `git commit failed (status ${commit.status})`
    ).trim();
    return { attempted: true, committed: false, error };
  }

  return { attempted: true, committed: true, message: commitMessage };
}
