import { describe, expect, it } from 'vitest';
import { formatOpenIssues } from '../src/loadIssues.js';

describe('formatOpenIssues', () => {
  it('returns placeholder when empty', () => {
    expect(formatOpenIssues([])).toBe('(no open issues)');
  });

  it('formats number and title as a markdown list', () => {
    expect(
      formatOpenIssues([
        { number: 3, title: 'Read issues into planner context' },
        { number: 4, title: 'Wire CI' },
      ]),
    ).toBe(
      '- #3: Read issues into planner context\n- #4: Wire CI',
    );
  });
});
