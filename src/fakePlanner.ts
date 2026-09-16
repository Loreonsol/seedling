import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFirstOpenIssue } from './loadIssues.js';
import type { Plan, Planner, PlannerContext } from './types.js';

/**
 * Deterministic offline planner — no API keys.
 * Prefers the first open GitHub issue title when any exist (human steer):
 * proposes a bounded src/steerTarget.ts edit shaped by that title.
 * Otherwise alternates VERSION bump vs journal note by journal count.
 */
export class FakePlanner implements Planner {
  async propose(ctx: PlannerContext): Promise<Plan> {
    const journals = listJournalFiles(ctx.rootDir);
    const steered = parseFirstOpenIssue(ctx.openIssues);
    // Humans steer via issues: bounded code edit shaped by the issue title.
    if (steered) {
      return proposeSteerTarget(ctx, steered);
    }
    // Even count → VERSION bump; odd count → next journal file.
    if (journals.length % 2 === 0) {
      return proposeVersionBump(ctx);
    }
    return proposeJournalNote(ctx, journals);
  }
}

function listJournalFiles(rootDir: string): string[] {
  const dir = join(rootDir, 'journal');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

function proposeVersionBump(ctx: PlannerContext): Plan {
  const targetPath = join(ctx.rootDir, 'src', 'version.ts');
  const current = readFileSync(targetPath, 'utf8');
  const match = current.match(/VERSION\s*=\s*['"](\d+)\.(\d+)\.(\d+)['"]/);
  if (!match) {
    throw new Error('FakePlanner: could not parse VERSION in src/version.ts');
  }
  const [, major, minor, patch] = match;
  const next = `${major}.${minor}.${Number(patch) + 1}`;
  const newContents = current.replace(
    /VERSION\s*=\s*['"]\d+\.\d+\.\d+['"]/,
    `VERSION = '${next}'`,
  );

  return {
    summary: `Bump VERSION ${major}.${minor}.${patch} → ${next}`,
    targetPath,
    newContents,
    commitMessage: `evolve: bump VERSION to ${next}`,
  };
}

/** Escape a title for a single-quoted TypeScript string literal. */
export function sanitizeSteerTitle(title: string, maxLen = 120): string {
  const trimmed = title.replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0, maxLen);
  return trimmed.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Bounded code edit shaped by the first open issue title.
 * Writes src/steerTarget.ts — reviewable, no secrets, reversible.
 */
export function buildSteerTargetContents(issue: {
  number: number;
  title: string;
}): string {
  const safeTitle = sanitizeSteerTitle(issue.title);
  return `/**
 * Last human steer captured by FakePlanner from open GitHub issues.
 * Regenerated on steered evolve cycles — safe, reviewable, no secrets.
 */
export const STEER_ISSUE = ${issue.number};
export const STEER_TITLE = '${safeTitle}';
`;
}

function proposeSteerTarget(
  ctx: PlannerContext,
  steered: { number: number; title: string },
): Plan {
  const targetPath = join(ctx.rootDir, 'src', 'steerTarget.ts');
  const newContents = buildSteerTargetContents(steered);

  return {
    summary: `Record steer #${steered.number} in steerTarget.ts: ${steered.title}`,
    targetPath,
    newContents,
    commitMessage: `evolve: record steer #${steered.number} in steerTarget.ts`,
  };
}

function proposeJournalNote(ctx: PlannerContext, journals: string[]): Plan {
  let max = -1;
  for (const f of journals) {
    const m = f.match(/^(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  const num = max + 1;
  const name = `${String(num).padStart(4, '0')}-fake-evolve.md`;
  const targetPath = join(ctx.rootDir, 'journal', name);
  const date = new Date().toISOString().slice(0, 10);
  const newContents = `# Journal ${String(num).padStart(4, '0')} — FakePlanner evolve note

**Date:** ${date}  
**Actor:** FakePlanner

## What happened

Offline evolve cycle appended this journal note instead of bumping VERSION,
so the planner practices a second safe edit shape (new file under \`journal/\`).

## Why

North star: plan → edit → test → commit with tiny, reversible steps and more
than one deterministic proposal type.

## Steering

(no open issues — alternating FakePlanner path)

## Open issues (steer)

${ctx.openIssues || '(no open issues)'}

## Recent commits

${ctx.recentCommits || '(no recent commits)'}

## Next

Steer via GitHub issues. Optional OpenAI-compatible planner behind \`SEEDLING_API_KEY\`.
`;

  return {
    summary: `Append journal note ${name}`,
    targetPath,
    newContents,
    commitMessage: `evolve: append journal ${name}`,
  };
}
