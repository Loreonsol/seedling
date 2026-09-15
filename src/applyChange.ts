import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { assertAllowedWritePath } from './writeAllowlist.js';

export type ApplyResult = {
  ok: boolean;
  restored: boolean;
};

/**
 * Write one file, run tests, restore previous contents if tests fail.
 * Keeps the evolve loop honest: a failed change does not stick.
 * Enforces the shared journal/|src/ write allowlist before touching disk.
 */
export function applyWithTestGate(
  targetPath: string,
  newContents: string,
  runTests: () => boolean,
  rootDir: string,
): ApplyResult {
  assertAllowedWritePath(rootDir, targetPath);

  const existed = existsSync(targetPath);
  const previous = existed ? readFileSync(targetPath, 'utf8') : null;

  writeFileSync(targetPath, newContents, 'utf8');

  const ok = runTests();
  if (ok) {
    return { ok: true, restored: false };
  }

  if (previous === null) {
    if (existsSync(targetPath)) unlinkSync(targetPath);
  } else {
    writeFileSync(targetPath, previous, 'utf8');
  }
  return { ok: false, restored: true };
}
