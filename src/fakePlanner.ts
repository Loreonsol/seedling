import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plan, Planner, PlannerContext } from './types.js';

/**
 * Deterministic offline planner — no API keys.
 * Proposes bumping the patch segment of VERSION in src/version.ts.
 */
export class FakePlanner implements Planner {
  async propose(ctx: PlannerContext): Promise<Plan> {
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
}
