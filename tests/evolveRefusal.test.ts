import { describe, expect, it } from 'vitest';
import { formatEvolveRefusal } from '../src/writeAllowlist.js';

describe('formatEvolveRefusal', () => {
  it('formats allowlist refusals without nesting evolve', () => {
    const msg = formatEvolveRefusal(
      new Error('Refuse write outside allowlist (journal/|src/): /tmp/README.md'),
    );
    expect(msg).toMatch(/^Refuse write outside allowlist/);
    expect(msg).toContain('README.md');
  });

  it('formats outside-repo-root refusals', () => {
    const msg = formatEvolveRefusal(
      new Error('Refuse to write outside repo root: /etc/passwd'),
    );
    expect(msg).toBe('Refuse to write outside repo root: /etc/passwd');
  });

  it('returns null for unrelated errors', () => {
    expect(formatEvolveRefusal(new Error('boom'))).toBeNull();
    expect(formatEvolveRefusal('string')).toBeNull();
    expect(formatEvolveRefusal(null)).toBeNull();
  });
});
