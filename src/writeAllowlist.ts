import { normalize, relative, resolve, sep } from 'node:path';

/** Only these top-level dirs may be written by the evolve apply gate. */
export const ALLOWED_WRITE_TOP_DIRS = ['journal', 'src'] as const;

/**
 * True when targetPath resolves under rootDir/journal or rootDir/src.
 * Rejects escapes (..), the repo root itself, and any other top-level path.
 */
export function isAllowedWritePath(rootDir: string, targetPath: string): boolean {
  const root = resolve(rootDir);
  const absolute = normalize(resolve(targetPath));
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (absolute !== root && !absolute.startsWith(prefix)) {
    return false;
  }
  const rel = relative(root, absolute);
  if (!rel || rel === '.' || rel.startsWith('..')) {
    return false;
  }
  const top = rel.split(/[/\\]/)[0] ?? '';
  return (ALLOWED_WRITE_TOP_DIRS as readonly string[]).includes(top);
}

/** Throw if the path is outside the shared write allowlist. */
export function assertAllowedWritePath(rootDir: string, targetPath: string): void {
  if (!isAllowedWritePath(rootDir, targetPath)) {
    throw new Error(
      `Refuse write outside allowlist (journal/|src/): ${targetPath}`,
    );
  }
}

/**
 * Clear message for allowlist / outside-root write refusals; null otherwise.
 * Used by the evolve CLI to print `[evolve] refused: …` instead of a fatal stack.
 */
export function formatEvolveRefusal(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message;
  if (
    msg.startsWith('Refuse write outside allowlist') ||
    msg.startsWith('Refuse to write outside repo root')
  ) {
    return msg;
  }
  return null;
}
