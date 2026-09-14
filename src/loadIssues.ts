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

/** First open issue from a formatOpenIssues / loadOpenIssues string, if any. */
export function parseFirstOpenIssue(
  openIssues: string,
): { number: number; title: string } | null {
  const line = openIssues
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('- #'));
  if (!line) return null;
  const m = line.match(/^- #(\d+):\s*(.+)$/);
  if (!m) return null;
  const title = m[2]!.trim();
  if (!title) return null;
  return { number: Number(m[1]), title };
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
