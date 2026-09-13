import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyWithTestGate } from '../src/applyChange.js';

let dir: string;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('applyWithTestGate', () => {
  it('keeps the new contents when tests pass', () => {
    dir = mkdtempSync(join(tmpdir(), 'seedling-apply-'));
    const target = join(dir, 'file.txt');
    writeFileSync(target, 'old', 'utf8');

    const result = applyWithTestGate(target, 'new', () => true);

    expect(result).toEqual({ ok: true, restored: false });
    expect(readFileSync(target, 'utf8')).toBe('new');
  });

  it('restores previous contents when tests fail', () => {
    dir = mkdtempSync(join(tmpdir(), 'seedling-apply-'));
    const target = join(dir, 'file.txt');
    writeFileSync(target, 'old', 'utf8');

    const result = applyWithTestGate(target, 'new', () => false);

    expect(result).toEqual({ ok: false, restored: true });
    expect(readFileSync(target, 'utf8')).toBe('old');
  });
});
