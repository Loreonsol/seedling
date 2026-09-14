/**
 * Planner contract: propose one tiny, safe improvement.
 * Real LLM planners can implement this; FakePlanner is the default.
 */
export interface Plan {
  /** Short human-readable summary of the proposed change. */
  summary: string;
  /** Absolute or repo-relative path to edit. */
  targetPath: string;
  /** Exact new file contents after the edit (minimal, reviewable). */
  newContents: string;
  /** Suggested git commit message. */
  commitMessage: string;
}

export interface PlannerContext {
  northStar: string;
  latestJournal: string;
  version: string;
  rootDir: string;
  /** Open GitHub issues summary for steering (or placeholder). */
  openIssues: string;
}

export interface Planner {
  propose(ctx: PlannerContext): Promise<Plan>;
}
