/**
 * GitHub Webhook & Agent Runner Contracts
 * Defines typings for Phase 1 Webhook Intake and Tracked Repository .portfolio.json
 */

/**
 * Standard configuration contract located at `.portfolio.json` in the root of any tracked repo
 */
export interface PortfolioConfig {
  track: boolean;
  projectTitle: string;
  projectSlug: string;
  schema?: string;
  $schema?: string;
  requireHumanApproval?: boolean;
  note?: string;
  ignoreDirectory?: string[];
  category?: string;
  liveUrl?: string;
  primaryBranch?: string;
  mediaPreferences?: {
    captureScreenshots?: boolean;
    generateArchitectureDiagrams?: boolean;
    [key: string]: unknown;
  };
  // Dynamic arbitrary metadata keys supported for custom future requirements
  [key: string]: unknown;
}

/**
 * Normalized inputs forwarded to Stage 2 GitHub Actions via workflow_dispatch
 * Note: GitHub REST API enforces a strict maximum length of 1024 characters per input.
 */
export interface WorkflowDispatchInputs {
  target_repo: string;
  commit_sha: string;
  branch: string;
  pr_number: string;
  pr_title: string;
  sender: string;
}

export interface GitHubSender {
  login: string;
  id: number;
  type: string; // 'User' | 'Bot'
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string; // 'owner/repo'
  default_branch: string;
  owner: {
    login: string;
    id: number;
  };
}

export interface GitHubCommit {
  id: string; // SHA
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
    username?: string;
  };
  added?: string[];
  removed?: string[];
  modified?: string[];
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  merge_commit_sha: string | null;
  base: {
    ref: string; // e.g., 'main'
    sha: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  user: GitHubSender;
  merged_by?: GitHubSender | null;
}

export interface GitHubPullRequestEvent {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | string;
  number: number;
  pull_request: GitHubPullRequest;
  repository: GitHubRepository;
  sender: GitHubSender;
}

export interface GitHubPushEvent {
  ref: string; // e.g., 'refs/heads/main'
  before: string;
  after: string;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  head_commit: GitHubCommit | null;
  commits: GitHubCommit[];
  repository: GitHubRepository;
  sender: GitHubSender;
}

export type GitHubWebhookPayload = GitHubPullRequestEvent | GitHubPushEvent;

