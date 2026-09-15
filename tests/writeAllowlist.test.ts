import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertAllowedWritePath,
  isAllowedWritePath,
} from '../src/writeAllowlist.js';

let dir: string | undefined;

afterEach(() => {
  if (dir) {
    rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  }
});

describe('writeAllowlist', () => {
  it('allows journal/ and src/ paths', () => {
    dir = mkdtempSync(join(tmpdir(), 'seedling-allow-'));
    expect(isAllowedWritePath(dir, join(dir, 'src', 'version.ts'))).toBe(true);
    expect(isAllowedWritePath(dir, join(dir, 'journal', '0001.md'))).toBe(true);
  });

  it('rejects root, other tops, and escapes', () => {
    dir = mkdtempSync(join(tmpdir(), 'seedling-allow-'));
    expect(isAllowedWritePath(dir, dir)).toBe(false);
    expect(isAllowedWritePath(dir, join(dir, 'README.md'))).toBe(false);
    expect(isAllowedWritePath(dir, join(dir, 'src', '..', 'README.md'))).toBe(
      false,
    );
    expect(() =>
      assertAllowedWritePath(dir, join(dir, '.env')),
    ).toThrow(/allowlist/);
  });
});
