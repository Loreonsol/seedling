import { describe, expect, it, vi } from 'vitest';
import {
  extractAssistantContent,
  extractJsonObject,
  HttpPlanner,
  parsePlanJson,
  resolveTargetPath,
} from '../src/httpPlanner.js';
import type { Planner, PlannerContext } from '../src/types.js';

const root = '/tmp/seedling-root';

const baseCtx: PlannerContext = {
  northStar: 'plan edit test commit',
  latestJournal: 'note',
  version: '0.1.0',
  rootDir: root,
  openIssues: '(no open issues)',
};

describe('resolveTargetPath', () => {
  it('resolves relative paths under root', () => {
    expect(resolveTargetPath(root, 'journal/0005.md')).toBe(
      `${root}/journal/0005.md`,
    );
  });

  it('rejects path escape', () => {
    expect(() => resolveTargetPath(root, '../outside.ts')).toThrow(/outside/);
  });
});


describe('extractJsonObject', () => {
  it('returns plain JSON unchanged', () => {
    const raw = '{"summary":"s","targetPath":"src/x.ts","newContents":"a","commitMessage":"evolve: x"}';
    expect(extractJsonObject(raw)).toBe(raw);
  });

  it('extracts object from surrounding prose', () => {
    const raw =
      'Sure — here is the plan:\n{"summary":"s","targetPath":"journal/n.md","newContents":"# n\n","commitMessage":"evolve: n"}\nHope that helps!';
    expect(extractJsonObject(raw)).toBe(
      '{"summary":"s","targetPath":"journal/n.md","newContents":"# n\n","commitMessage":"evolve: n"}',
    );
  });

  it('throws when no object is present', () => {
    expect(() => extractJsonObject('no json here')).toThrow(/no JSON object/);
  });
});

describe('parsePlanJson', () => {
  it('parses plain JSON plan', () => {
    const plan = parsePlanJson(
      JSON.stringify({
        summary: 'Add note',
        targetPath: 'journal/x.md',
        newContents: '# hi\n',
        commitMessage: 'evolve: add note',
      }),
      root,
    );
    expect(plan.summary).toBe('Add note');
    expect(plan.targetPath).toBe(`${root}/journal/x.md`);
    expect(plan.newContents).toBe('# hi\n');
    expect(plan.commitMessage).toBe('evolve: add note');
  });

  it('strips markdown fences', () => {
    const plan = parsePlanJson(
      '```json\n{"summary":"s","targetPath":"src/version.ts","newContents":"x","commitMessage":"evolve: x"}\n```',
      root,
    );
    expect(plan.targetPath).toBe(`${root}/src/version.ts`);
  });

  it('parses plan wrapped in prose', () => {
    const plan = parsePlanJson(
      'Here you go:\n{"summary":"note","targetPath":"journal/y.md","newContents":"# y\\n","commitMessage":"evolve: y"}\nDone.',
      root,
    );
    expect(plan.summary).toBe('note');
    expect(plan.targetPath).toBe(`${root}/journal/y.md`);
    expect(plan.newContents).toBe('# y\n');
  });

  it('rejects incomplete JSON', () => {
    expect(() =>
      parsePlanJson(JSON.stringify({ summary: 'only' }), root),
    ).toThrow(/missing required/);
  });

  it('rejects plans targeting paths outside journal/|src/', () => {
    expect(() =>
      parsePlanJson(
        JSON.stringify({
          summary: 'bad',
          targetPath: 'README.md',
          newContents: 'x',
          commitMessage: 'evolve: bad',
        }),
        root,
      ),
    ).toThrow(/allowlist/);
  });
});

describe('extractAssistantContent', () => {
  it('reads choices[0].message.content', () => {
    const body = JSON.stringify({
      choices: [{ message: { content: '{"summary":"ok"}' } }],
    });
    expect(extractAssistantContent(body)).toBe('{"summary":"ok"}');
  });

  it('throws on empty content', () => {
    expect(() =>
      extractAssistantContent(JSON.stringify({ choices: [{ message: {} }] })),
    ).toThrow(/empty/);
  });
});

describe('HttpPlanner', () => {
  it('builds a plan from a successful API response', async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'Bump patch',
                  targetPath: 'src/version.ts',
                  newContents: "export const VERSION = '0.1.1';\n",
                  commitMessage: 'evolve: bump VERSION to 0.1.1',
                }),
              },
            },
          ],
        }),
    }));

    const planner = new HttpPlanner('test-key', {
      baseUrl: 'https://example.test/v1',
      fetchFn,
    });
    const plan = await planner.propose(baseCtx);
    expect(plan.summary).toBe('Bump patch');
    expect(plan.targetPath).toBe(`${root}/src/version.ts`);
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://example.test/v1/chat/completions');
    expect(init?.headers?.Authorization).toBe('Bearer test-key');
  });

  it('falls back when the API errors', async () => {
    const fallbackPlan = {
      summary: 'fallback',
      targetPath: `${root}/journal/f.md`,
      newContents: '# f\n',
      commitMessage: 'evolve: fallback',
    };
    const fallback: Planner = {
      propose: async () => fallbackPlan,
    };
    const fetchFn = vi.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => 'nope',
    }));
    const planner = new HttpPlanner('bad-key', { fetchFn, fallback });
    const plan = await planner.propose(baseCtx);
    expect(plan).toEqual(fallbackPlan);
  });
});
