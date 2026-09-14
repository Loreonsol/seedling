import { describe, expect, it } from 'vitest';
import { formatOpenIssues, parseFirstOpenIssue } from '../src/loadIssues.js';

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

describe('parseFirstOpenIssue', () => {
  it('returns null for placeholder or empty', () => {
    expect(parseFirstOpenIssue('(no open issues)')).toBeNull();
    expect(parseFirstOpenIssue('')).toBeNull();
  });

  it('parses the first markdown list issue', () => {
    expect(
      parseFirstOpenIssue(
        '- #7: teach planner to prefer issue titles\n- #8: Wire CI',
      ),
    ).toEqual({ number: 7, title: 'teach planner to prefer issue titles' });
  });
});
