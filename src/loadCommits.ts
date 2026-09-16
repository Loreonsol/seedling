import { spawnSync } from 'node:child_process';

/**
 * Load recent git commits as planner context (what just shipped).
 * Uses `git log` when available; returns a short placeholder on failure or empty.
 * Pure formatting helpers are exported for unit tests.
 */
export function formatRecentCommits(
  commits: Array<{ sha: string; subject: string }>,
): string {
  if (commits.length === 0) return '(no recent commits)';
  return commits
    .map((c) => {
      const short = c.sha.length > 7 ? c.sha.slice(0, 7) : c.sha;
      return `- ${short}: ${c.subject}`;
    })
    .join('\n');
}

export function loadRecentCommits(rootDir: string, limit?: number): string {
  const n = limit ?? 8;
  const result = spawnSync(
    'git',
    ['log', `-n`, String(n), '--pretty=format:%H\t%s'],
    {
      cwd: rootDir,
      encoding: 'utf8',
      env: process.env,
    },
  );

  if (result.status !== 0 || !result.stdout?.trim()) {
    return '(no recent commits)';
  }

  try {
    const lines = result.stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const commits: Array<{ sha: string; subject: string }> = [];
    for (const line of lines) {
      const tab = line.indexOf('\t');
      if (tab <= 0) continue;
      const sha = line.slice(0, tab).trim();
      const subject = line.slice(tab + 1).trim();
      if (!sha || !subject) continue;
      if (!/^[0-9a-f]{7,40}$/i.test(sha)) continue;
      commits.push({ sha, subject });
    }
    return formatRecentCommits(commits);
  } catch {
    return '(no recent commits)';
  }
}
