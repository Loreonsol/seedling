import { join, normalize, resolve } from 'node:path';
import type { Plan, Planner, PlannerContext } from './types.js';

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

/**
 * OpenAI-compatible chat planner behind SEEDLING_API_KEY.
 * Expects the model to return a JSON Plan; falls back when provided.
 */
export class HttpPlanner implements Planner {
  constructor(
    private readonly apiKey: string,
    private readonly options: {
      baseUrl?: string;
      fetchFn?: FetchLike;
      fallback?: Planner;
      model?: string;
    } = {},
  ) {}

  async propose(ctx: PlannerContext): Promise<Plan> {
    try {
      return await this.proposeFromApi(ctx);
    } catch (err) {
      if (this.options.fallback) {
        console.warn(
          '[HttpPlanner] API plan failed; falling back to FakePlanner:',
          err instanceof Error ? err.message : err,
        );
        return this.options.fallback.propose(ctx);
      }
      throw err;
    }
  }

  private async proposeFromApi(ctx: PlannerContext): Promise<Plan> {
    const baseUrl = (
      this.options.baseUrl ??
      process.env.SEEDLING_API_BASE ??
      'https://api.openai.com/v1'
    ).replace(/\/$/, '');
    const model =
      this.options.model ?? process.env.SEEDLING_API_MODEL ?? 'gpt-4o-mini';
    const fetchFn = this.options.fetchFn ?? (globalThis.fetch as FetchLike);

    const system = `You are Seedling's planner. Propose ONE tiny, safe file change.
Reply with ONLY JSON (no markdown fences) matching:
{"summary":"...","targetPath":"repo-relative/path","newContents":"...","commitMessage":"evolve: ..."}
Rules: stay under the repo root; only edit journal/ or src/; never invent secrets; keep changes reversible; one file only.`;

    const user = `North star:\n${ctx.northStar}\n\nVersion: ${ctx.version}\n\nLatest journal:\n${ctx.latestJournal}\n\nOpen issues:\n${ctx.openIssues}`;

    const res = await fetchFn(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from planner API`);
    }

    const raw = await res.text();
    const content = extractAssistantContent(raw);
    return parsePlanJson(content, ctx.rootDir);
  }
}

/** Pull assistant message content from an OpenAI-style chat completion body. */
export function extractAssistantContent(rawBody: string): string {
  const parsed = JSON.parse(rawBody) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = parsed.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('HttpPlanner: empty assistant content');
  }
  return content.trim();
}

/**
 * Best-effort: pull the first JSON object out of model prose / fences.
 * Models often wrap plans in explanation text; we still want a Plan.
 */
export function extractJsonObject(text: string): string {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    JSON.parse(stripped);
    return stripped;
  } catch {
    // fall through to brace scan
  }
  const start = stripped.indexOf('{');
  if (start < 0) {
    throw new Error('HttpPlanner: no JSON object found in assistant content');
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i]!;
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return stripped.slice(start, i + 1);
      }
    }
  }
  throw new Error('HttpPlanner: incomplete JSON object in assistant content');
}

/**
 * Parse model JSON into a Plan and resolve targetPath under rootDir.
 * Tolerates optional ```json fences and leading/trailing prose.
 */
export function parsePlanJson(text: string, rootDir: string): Plan {
  const stripped = extractJsonObject(text);
  const data = JSON.parse(stripped) as Partial<Plan>;
  if (
    typeof data.summary !== 'string' ||
    typeof data.targetPath !== 'string' ||
    typeof data.newContents !== 'string' ||
    typeof data.commitMessage !== 'string'
  ) {
    throw new Error('HttpPlanner: plan JSON missing required string fields');
  }
  return {
    summary: data.summary,
    targetPath: resolveTargetPath(rootDir, data.targetPath),
    newContents: data.newContents,
    commitMessage: data.commitMessage,
  };
}

/** Resolve a relative path under rootDir; reject escapes. */
export function resolveTargetPath(rootDir: string, targetPath: string): string {
  const root = resolve(rootDir);
  const absolute = normalize(
    targetPath.startsWith(root)
      ? targetPath
      : join(root, targetPath.replace(/^\.\/+/, '')),
  );
  if (absolute !== root && !absolute.startsWith(root + '/')) {
    throw new Error(`HttpPlanner: refuse path outside repo root: ${targetPath}`);
  }
  return absolute;
}
