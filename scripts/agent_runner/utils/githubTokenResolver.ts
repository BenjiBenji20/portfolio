/**
 * GitHub Read Token Resolver for Multi-Owner Tracked Repositories
 *
 * Routes read requests to either the personal fine-grained token (`GIT_REPO_PAT_TOKEN`)
 * or the organization fine-grained token (`GIT_PAT_ORGANIZATION`) based on repository owner,
 * preserving strict least-privilege (read-only) separation across GitHub owners.
 */

function parseOrgPatMap(rawMap: string | undefined, owner: string): string | undefined {
  if (!rawMap || !rawMap.trim()) return undefined;
  try {
    const parsed: unknown = JSON.parse(rawMap);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const entries = Object.entries(parsed as Record<string, unknown>);
    const matched = entries.find(([key]) => key.toLowerCase() === owner.toLowerCase());
    return typeof matched?.[1] === 'string' && matched[1].trim() ? matched[1].trim() : undefined;
  } catch {
    console.warn('[GitHubTokenResolver] Ignoring malformed GIT_ORG_PAT_MAP JSON.');
    return undefined;
  }
}

function getRepoOwner(targetRepo: string): string {
  const parts = targetRepo.split('/');
  return (parts[0] || '').trim();
}

function getPersonalOwner(): string | undefined {
  const configured = process.env.PORTFOLIO_REPO_OWNER || process.env.GITHUB_REPOSITORY_OWNER;
  return configured && configured.trim() ? configured.trim() : undefined;
}

/**
 * Returns an ordered, deduplicated list of candidate GitHub tokens for reading `targetRepo`.
 * When `PORTFOLIO_REPO_OWNER` is known, organization repos prioritize `GIT_PAT_ORGANIZATION`
 * while personal repos prioritize `GIT_REPO_PAT_TOKEN`.
 */
export function getGitHubReadTokenCandidates(targetRepo: string, explicitToken?: string): string[] {
  const candidates: Array<string | undefined> = [];

  if (explicitToken && explicitToken.trim()) {
    candidates.push(explicitToken.trim());
  }

  const repoOwner = getRepoOwner(targetRepo);
  const personalOwner = getPersonalOwner();

  if (repoOwner) {
    const normalizedOwnerKey = `GIT_PAT_${repoOwner.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    candidates.push(process.env[normalizedOwnerKey]);
    candidates.push(parseOrgPatMap(process.env.GIT_ORG_PAT_MAP, repoOwner));
  }

  const isExternalOwner =
    Boolean(repoOwner) &&
    Boolean(personalOwner) &&
    repoOwner.toLowerCase() !== personalOwner!.toLowerCase();

  if (isExternalOwner) {
    candidates.push(process.env.GIT_PAT_ORGANIZATION);
    candidates.push(process.env.GIT_REPO_PAT_TOKEN);
  } else {
    candidates.push(process.env.GIT_REPO_PAT_TOKEN);
    candidates.push(process.env.GIT_PAT_ORGANIZATION);
  }

  candidates.push(process.env.GITHUB_TOKEN);

  const seen = new Set<string>();
  const uniqueTokens: string[] = [];
  for (const token of candidates) {
    const trimmed = token?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      uniqueTokens.push(trimmed);
    }
  }

  return uniqueTokens;
}

/**
 * Resolves the highest-priority GitHub read token for `targetRepo`.
 */
export function resolveGitHubReadToken(targetRepo: string, explicitToken?: string): string | undefined {
  return getGitHubReadTokenCandidates(targetRepo, explicitToken)[0];
}

/**
 * Builds standardized GitHub REST API request headers.
 */
export function buildGitHubHeaders(
  token?: string,
  accept = 'application/vnd.github+json'
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'Benjineer-Agent-Runner',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

