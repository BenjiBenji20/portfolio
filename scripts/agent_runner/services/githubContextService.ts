/**
 * Service to fetch PR metadata, commit details, and raw git diffs from GitHub REST API
 */

export interface GitHubContext {
  prBody: string;
  commitMessage: string;
  rawDiff: string;
  changedFiles: string[];
}

const MAX_DIFF_CHARS = 25000;

export async function fetchGitHubContext(
  targetRepo: string,
  commitSha: string,
  prNumber?: string,
  ignoreDirectories: string[] = [],
  githubToken?: string
): Promise<GitHubContext> {
  const token = githubToken || process.env.GIT_REPO_PAT_TOKEN || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'Benjineer-Agent-Runner',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let prBody = '';
  let commitMessage = '';
  let rawDiff = '';
  let changedFiles: string[] = [];

  // 1. Fetch Pull Request body if prNumber is present
  if (prNumber) {
    try {
      console.log(`[GitHubContext] Fetching PR #${prNumber} details from ${targetRepo}...`);
      const prRes = await fetch(`https://api.github.com/repos/${targetRepo}/pulls/${prNumber}`, {
        headers: { ...headers, Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(10000),
      });

      if (prRes.ok) {
        const prJson = await prRes.json();
        prBody = prJson.body || '';
      }
    } catch (err) {
      console.warn(`[GitHubContext] Failed to fetch PR #${prNumber} body:`, err);
    }
  }

  // 2. Fetch commit details and file list
  try {
    console.log(`[GitHubContext] Fetching commit ${commitSha.slice(0, 7)} details from ${targetRepo}...`);
    const commitRes = await fetch(`https://api.github.com/repos/${targetRepo}/commits/${commitSha}`, {
      headers: { ...headers, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(10000),
    });

    if (commitRes.ok) {
      const commitJson = await commitRes.json();
      commitMessage = commitJson.commit?.message || '';
      if (commitJson.files && Array.isArray(commitJson.files)) {
        changedFiles = commitJson.files.map((f: { filename: string }) => f.filename);
      }
    }
  } catch (err) {
    console.warn(`[GitHubContext] Failed to fetch commit metadata:`, err);
  }

  // 3. Fetch raw git diff
  try {
    console.log(`[GitHubContext] Fetching raw git diff for ${commitSha.slice(0, 7)}...`);
    const diffRes = await fetch(`https://api.github.com/repos/${targetRepo}/commits/${commitSha}`, {
      headers: { ...headers, Accept: 'application/vnd.github.v3.diff' },
      signal: AbortSignal.timeout(15000),
    });

    if (diffRes.ok) {
      rawDiff = await diffRes.text();
    }
  } catch (err) {
    console.warn(`[GitHubContext] Failed to fetch raw git diff:`, err);
  }

  // 4. Scrub diff against ignoreDirectory
  if (ignoreDirectories.length > 0 && rawDiff) {
    rawDiff = scrubDiff(rawDiff, ignoreDirectories);
  }

  // 5. Enforce 25,000-character budget with graceful hunk truncation
  if (rawDiff.length > MAX_DIFF_CHARS) {
    console.log(`[GitHubContext] Raw diff (${rawDiff.length} chars) exceeds ${MAX_DIFF_CHARS} budget. Truncating hunks...`);
    rawDiff =
      rawDiff.slice(0, MAX_DIFF_CHARS) +
      `\n\n[... Diff truncated at ${MAX_DIFF_CHARS} chars by Agent Runner to preserve token budget ...]`;
  }

  return {
    prBody,
    commitMessage,
    rawDiff,
    changedFiles,
  };
}

/**
 * Strips diff blocks matching paths in ignoreDirectories
 */
function scrubDiff(diff: string, ignoreDirectories: string[]): string {
  const fileDiffs = diff.split(/^diff --git /m);
  if (fileDiffs.length <= 1) return diff;

  const keptBlocks: string[] = [];

  for (const block of fileDiffs) {
    if (!block.trim()) continue;
    const firstLine = block.split('\n')[0];
    const isIgnored = ignoreDirectories.some((dir) => {
      const normalizedDir = dir.replace(/^\/+|\/+$/g, '');
      return firstLine.includes(`a/${normalizedDir}/`) || firstLine.includes(`b/${normalizedDir}/`);
    });

    if (!isIgnored) {
      keptBlocks.push('diff --git ' + block);
    }
  }

  return keptBlocks.join('\n');
}

