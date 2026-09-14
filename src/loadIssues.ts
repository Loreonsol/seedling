import { spawnSync } from 'node:child_process';

/**
 * Load open GitHub issues as planner context (steer via issues).
 * Uses `gh` when available; returns a short placeholder on failure or empty.
 * Pure formatting helpers are exported for unit tests.
 */
export function formatOpenIssues(
  issues: Array<{ number: number; title: string }>,
): string {
  if (issues.length === 0) return '(no open issues)';
  return issues
    .map((i) => `- #${i.number}: ${i.title}`)
    .join('\n');
}

export function loadOpenIssues(rootDir: string): string {
  const result = spawnSync(
    'gh',
    [
      'issue',
      'list',
      '--state',
      'open',
      '--json',
      'number,title',
      '--limit',
      '10',
    ],
    {
      cwd: rootDir,
      encoding: 'utf8',
      env: process.env,
    },
  );

  if (result.status !== 0 || !result.stdout?.trim()) {
    return '(no open issues)';
  }

  try {
    const parsed = JSON.parse(result.stdout) as Array<{
      number: number;
      title: string;
    }>;
    if (!Array.isArray(parsed)) return '(no open issues)';
    return formatOpenIssues(
      parsed.filter(
        (i) =>
          typeof i?.number === 'number' && typeof i?.title === 'string',
      ),
    );
  } catch {
    return '(no open issues)';
  }
}
