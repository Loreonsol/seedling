import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFirstOpenIssue } from './loadIssues.js';
import type { Plan, Planner, PlannerContext } from './types.js';

/**
 * Deterministic offline planner — no API keys.
 * Prefers the first open GitHub issue title when any exist (human steer).
 * Otherwise alternates VERSION bump vs journal note by journal count.
 */
export class FakePlanner implements Planner {
  async propose(ctx: PlannerContext): Promise<Plan> {
    const journals = listJournalFiles(ctx.rootDir);
    const steered = parseFirstOpenIssue(ctx.openIssues);
    // Humans steer via issues: prefer a journal note that cites the first issue.
    if (steered) {
      return proposeJournalNote(ctx, journals, steered);
    }
    // Even count → VERSION bump; odd count → next journal file.
    if (journals.length % 2 === 0) {
      return proposeVersionBump(ctx);
    }
    return proposeJournalNote(ctx, journals, null);
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

function proposeJournalNote(
  ctx: PlannerContext,
  journals: string[],
  steered: { number: number; title: string } | null,
): Plan {
  let max = -1;
  for (const f of journals) {
    const m = f.match(/^(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  const num = max + 1;
  const name = `${String(num).padStart(4, '0')}-fake-evolve.md`;
  const targetPath = join(ctx.rootDir, 'journal', name);
  const date = new Date().toISOString().slice(0, 10);
  const steerBlock = steered
    ? `Steering issue: #${steered.number}: ${steered.title}`
    : '(no open issues — alternating FakePlanner path)';
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

${steerBlock}

## Open issues (steer)

${ctx.openIssues || '(no open issues)'}

## Next

Steer via GitHub issues. Optional OpenAI-compatible planner behind \`SEEDLING_API_KEY\`.
`;

  const summary = steered
    ? `Append journal note ${name} (steer #${steered.number}: ${steered.title})`
    : `Append journal note ${name}`;
  const commitMessage = steered
    ? `evolve: append journal ${name} (steer #${steered.number})`
    : `evolve: append journal ${name}`;

  return {
    summary,
    targetPath,
    newContents,
    commitMessage,
  };
}
