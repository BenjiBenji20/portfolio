import { buildGitHubHeaders, getGitHubReadTokenCandidates } from '../utils/githubTokenResolver';
import { redactSecrets } from '../utils/secretRedactor';

/**
 * Service to fetch PR metadata, commit details, and raw git diffs from GitHub REST API
 */

export interface FileDelta {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GitHubContext {
  prBody: string;
  commitMessage: string;
  rawDiff: string;
  diffStat: string;
  changedFiles: string[];
  fileDeltas: FileDelta[];
}

const MAX_DIFF_CHARS = 25000;

const DEFAULT_IGNORED_SEGMENTS = [
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.ruff_cache',
  'venv',
  '.venv',
  'env',
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.turbo',
  '.git',
];

const DEFAULT_IGNORED_EXTENSIONS = [
  '.pyc',
  '.pyo',
  '.pyd',
  '.map',
  '.min.js',
  '.min.css',
  '.wasm',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.7z',
  '.rar',
  '.sqlite',
  '.db',
  '.ds_store',
];

function isIgnoredPath(filepath: string, userIgnoreDirs: string[] = []): boolean {
  const normalized = filepath.toLowerCase().replace(/\\/g, '/');

  // Check user specified ignore directories
  for (const dir of userIgnoreDirs) {
    const cleaned = dir.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (normalized.startsWith(cleaned) || normalized.includes(`/${cleaned}/`)) {
      return true;
    }
  }

  // Check default build / virtualenv / cache directory segments
  for (const segment of DEFAULT_IGNORED_SEGMENTS) {
    if (
      normalized.startsWith(`${segment}/`) ||
      normalized.includes(`/${segment}/`) ||
      normalized.endsWith(`/${segment}`)
    ) {
      return true;
    }
  }

  // Check binary & build extensions
  for (const ext of DEFAULT_IGNORED_EXTENSIONS) {
    if (normalized.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

interface RawGithubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

function extractTrackedDeltas(
  rawFiles: RawGithubFile[],
  ignoreDirectories: string[],
  analysisLabel: string
): { changedFiles: string[]; fileDeltas: FileDelta[]; diffStat: string } {
  const trackedFiles = rawFiles.filter((f) => !isIgnoredPath(f.filename, ignoreDirectories));
  const ignoredFiles = rawFiles.filter((f) => isIgnoredPath(f.filename, ignoreDirectories));

  const changedFiles = trackedFiles.map((f) => f.filename);
  const fileDeltas: FileDelta[] = trackedFiles.map((f) => ({
    filename: f.filename,
    status: f.status || 'modified',
    additions: f.additions || 0,
    deletions: f.deletions || 0,
    patch: f.patch,
  }));

  const diffStat = fileDeltas
    .map((f) => `${f.filename} (+${f.additions}, -${f.deletions}) [${f.status}]`)
    .join('\n');

  console.log(`[GitHubContext] ${analysisLabel} (${rawFiles.length} total files):`);
  if (changedFiles.length > 0) {
    console.log(`[GitHubContext] Tracked files sent to AI Agent (${changedFiles.length}):`);
    changedFiles.forEach((file: string) => console.log(`   + [TRACKED] ${file}`));
  } else {
    console.log(`[GitHubContext] Tracked files sent to AI Agent: (None)`);
  }

  if (ignoredFiles.length > 0) {
    console.log(`[GitHubContext] Ignored/excluded files (${ignoredFiles.length}):`);
    ignoredFiles.forEach((f) => console.log(`   - [IGNORED] ${f.filename}`));
  }

  return { changedFiles, fileDeltas, diffStat };
}

interface SingleCommitMetadata {
  commitMessage: string;
  rawFiles: RawGithubFile[];
  parentSha?: string;
}

async function fetchSingleCommitMetadata(
  targetRepo: string,
  commitSha: string,
  headers: Record<string, string>
): Promise<SingleCommitMetadata> {
  console.log(`[GitHubContext] Fetching single commit ${commitSha.slice(0, 7)} details from ${targetRepo}...`);
  const commitRes = await fetch(`https://api.github.com/repos/${targetRepo}/commits/${commitSha}`, {
    headers: { ...headers, Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(30000), // Balanced 30s timeout
  });

  if (!commitRes.ok) {
    console.warn(
      `[GitHubContext] Single commit fetch failed (HTTP ${commitRes.status}) for ${targetRepo}@${commitSha.slice(0, 7)}.`
    );
    return { commitMessage: '', rawFiles: [] };
  }

  const commitJson = (await commitRes.json()) as {
    commit?: { message?: string };
    parents?: Array<{ sha?: string }>;
    files?: RawGithubFile[];
  };
  return {
    commitMessage: commitJson.commit?.message || '',
    rawFiles: Array.isArray(commitJson.files) ? commitJson.files : [],
    parentSha: commitJson.parents?.[0]?.sha,
  };
}

type ResolvedRange =
  | { mode: 'single' }
  | { mode: 'compare'; resolvedBaseSha: string }
  | { mode: 'root_plus_compare'; firstCommitSha: string; rootCommitData: SingleCommitMetadata };

async function resolveComparisonRange(
  targetRepo: string,
  commitSha: string,
  baseSha: string | undefined,
  headers: Record<string, string>
): Promise<ResolvedRange> {
  if (!baseSha || baseSha.startsWith('0000000') || baseSha === commitSha) {
    return { mode: 'single' };
  }

  if (baseSha.startsWith('parent:')) {
    const firstCommitSha = baseSha.slice('parent:'.length).trim();
    if (!firstCommitSha || firstCommitSha === commitSha) {
      return { mode: 'single' };
    }
    const firstCommitData = await fetchSingleCommitMetadata(targetRepo, firstCommitSha, headers);
    if (firstCommitData.parentSha) {
      console.log(
        `[GitHubContext] Resolved base parent ${firstCommitData.parentSha.slice(0, 7)} for multi-commit push starting at ${firstCommitSha.slice(0, 7)}.`
      );
      return { mode: 'compare', resolvedBaseSha: firstCommitData.parentSha };
    }
    console.log(
      `[GitHubContext] Multi-commit push starts at root commit ${firstCommitSha.slice(0, 7)}. Aggregating root + comparison range.`
    );
    return { mode: 'root_plus_compare', firstCommitSha, rootCommitData: firstCommitData };
  }

  return { mode: 'compare', resolvedBaseSha: baseSha };
}

function mergeRawFiles(primary: RawGithubFile[], secondary: RawGithubFile[]): RawGithubFile[] {
  const merged = new Map<string, RawGithubFile>();
  for (const file of primary) {
    merged.set(file.filename, file);
  }
  for (const file of secondary) {
    merged.set(file.filename, file);
  }
  return Array.from(merged.values());
}

async function fetchRawDiffText(
  url: string,
  headers: Record<string, string>,
  label: string
): Promise<{ ok: boolean; status: number; text: string }> {
  console.log(`[GitHubContext] Fetching raw git diff for ${label}...`);
  const res = await fetch(url, {
    headers: { ...headers, Accept: 'application/vnd.github.v3.diff' },
    signal: AbortSignal.timeout(30000),
  });
  const text = res.ok ? await res.text() : '';
  return { ok: res.ok, status: res.status, text };
}

async function resolveActiveGitHubHeaders(
  targetRepo: string,
  explicitToken?: string
): Promise<Record<string, string>> {
  const candidates = getGitHubReadTokenCandidates(targetRepo, explicitToken);
  if (candidates.length === 0) return buildGitHubHeaders(undefined);

  const hasExplicitOwnerContext = Boolean(
    explicitToken || process.env.PORTFOLIO_REPO_OWNER || process.env.GITHUB_REPOSITORY_OWNER
  );
  if (candidates.length === 1 || hasExplicitOwnerContext) {
    return buildGitHubHeaders(candidates[0]);
  }

  for (let i = 0; i < candidates.length - 1; i++) {
    const candidateHeaders = buildGitHubHeaders(candidates[i]);
    try {
      const checkRes = await fetch(`https://api.github.com/repos/${targetRepo}`, {
        headers: candidateHeaders,
        signal: AbortSignal.timeout(10000),
      });
      if (checkRes.ok) return candidateHeaders;
      if (checkRes.status !== 401 && checkRes.status !== 403 && checkRes.status !== 404) {
        return candidateHeaders;
      }
    } catch {
      return candidateHeaders;
    }
  }

  return buildGitHubHeaders(candidates[candidates.length - 1]);
}

export async function fetchGitHubContext(
  targetRepo: string,
  commitSha: string,
  prNumber?: string,
  ignoreDirectories: string[] = [],
  githubToken?: string,
  baseSha?: string
): Promise<GitHubContext> {
  const headers = await resolveActiveGitHubHeaders(targetRepo, githubToken);

  let prBody = '';
  let commitMessage = '';
  let rawDiff = '';
  let diffStat = '';
  let changedFiles: string[] = [];
  let fileDeltas: FileDelta[] = [];

  const resolvedRange = await resolveComparisonRange(targetRepo, commitSha, baseSha, headers);

  // 1. Fetch Pull Request body if prNumber is present
  if (prNumber) {
    try {
      console.log(`[GitHubContext] Fetching PR #${prNumber} details from ${targetRepo}...`);
      const prRes = await fetch(`https://api.github.com/repos/${targetRepo}/pulls/${prNumber}`, {
        headers: { ...headers, Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(30000), // Balanced 30s timeout
      });

      if (prRes.ok) {
        const prJson = (await prRes.json()) as { body?: string };
        prBody = prJson.body || '';
      }
    } catch (err) {
      console.warn(`[GitHubContext] Failed to fetch PR #${prNumber} body: ${redactSecrets(err)}`);
    }
  }

  // 2. Fetch commit/range details and file list
  try {
    let rawFiles: RawGithubFile[] = [];
    let analysisLabel = 'Commit File Analysis';

    if (resolvedRange.mode === 'compare' || resolvedRange.mode === 'root_plus_compare') {
      const compareBase =
        resolvedRange.mode === 'compare' ? resolvedRange.resolvedBaseSha : resolvedRange.firstCommitSha;
      console.log(
        `[GitHubContext] Push contains multiple commits. Fetching comparison range (${compareBase.slice(0, 7)}...${commitSha.slice(0, 7)}) from ${targetRepo}...`
      );
      const compareUrl = `https://api.github.com/repos/${targetRepo}/compare/${compareBase}...${commitSha}`;
      const compareRes = await fetch(compareUrl, {
        headers: { ...headers, Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(30000),
      });

      if (compareRes.ok) {
        const compareJson = (await compareRes.json()) as {
          commits?: Array<{ commit?: { message?: string } }>;
          files?: RawGithubFile[];
        };
        const compareMessages = Array.isArray(compareJson.commits)
          ? compareJson.commits.map((c) => c.commit?.message || '').filter(Boolean)
          : [];
        const compareFiles = Array.isArray(compareJson.files) ? compareJson.files : [];

        if (resolvedRange.mode === 'root_plus_compare') {
          commitMessage = [resolvedRange.rootCommitData.commitMessage, ...compareMessages]
            .filter(Boolean)
            .join('\n\n---\n\n');
          rawFiles = mergeRawFiles(resolvedRange.rootCommitData.rawFiles, compareFiles);
        } else {
          commitMessage = compareMessages.join('\n\n---\n\n');
          rawFiles = compareFiles;
        }
        analysisLabel = 'Comparison Range File Analysis';
      } else {
        console.warn(
          `[GitHubContext] Comparison range returned HTTP ${compareRes.status} (e.g. rewritten/force-pushed base SHA). Falling back to single commit...`
        );
        const single = await fetchSingleCommitMetadata(targetRepo, commitSha, headers);
        commitMessage = single.commitMessage;
        rawFiles = single.rawFiles;
      }
    } else {
      const single = await fetchSingleCommitMetadata(targetRepo, commitSha, headers);
      commitMessage = single.commitMessage;
      rawFiles = single.rawFiles;
    }

    const extracted = extractTrackedDeltas(rawFiles, ignoreDirectories, analysisLabel);
    changedFiles = extracted.changedFiles;
    fileDeltas = extracted.fileDeltas;
    diffStat = extracted.diffStat;
  } catch (err) {
    console.warn(`[GitHubContext] Failed to fetch commit or comparison metadata: ${redactSecrets(err)}`);
  }

  // 3. Fetch raw git diff (single commit, comparison range, or root + comparison range)
  try {
    if (resolvedRange.mode === 'root_plus_compare') {
      const rootDiff = await fetchRawDiffText(
        `https://api.github.com/repos/${targetRepo}/commits/${resolvedRange.firstCommitSha}`,
        headers,
        resolvedRange.firstCommitSha.slice(0, 7)
      );
      const tailDiff = await fetchRawDiffText(
        `https://api.github.com/repos/${targetRepo}/compare/${resolvedRange.firstCommitSha}...${commitSha}`,
        headers,
        `${resolvedRange.firstCommitSha.slice(0, 7)}...${commitSha.slice(0, 7)}`
      );
      rawDiff = [rootDiff.text, tailDiff.text].filter(Boolean).join('\n');
    } else if (resolvedRange.mode === 'compare') {
      const compareDiff = await fetchRawDiffText(
        `https://api.github.com/repos/${targetRepo}/compare/${resolvedRange.resolvedBaseSha}...${commitSha}`,
        headers,
        `${resolvedRange.resolvedBaseSha.slice(0, 7)}...${commitSha.slice(0, 7)}`
      );
      if (compareDiff.ok) {
        rawDiff = compareDiff.text;
      } else {
        console.warn(
          `[GitHubContext] Comparison raw diff returned HTTP ${compareDiff.status}. Falling back to single commit diff...`
        );
        const fallbackDiff = await fetchRawDiffText(
          `https://api.github.com/repos/${targetRepo}/commits/${commitSha}`,
          headers,
          commitSha.slice(0, 7)
        );
        rawDiff = fallbackDiff.text;
      }
    } else {
      const singleDiff = await fetchRawDiffText(
        `https://api.github.com/repos/${targetRepo}/commits/${commitSha}`,
        headers,
        commitSha.slice(0, 7)
      );
      rawDiff = singleDiff.text;
      if (!singleDiff.ok) {
        console.warn(`[GitHubContext] Failed to fetch raw git diff (HTTP ${singleDiff.status}).`);
      }
    }
  } catch (err) {
    console.warn(`[GitHubContext] Failed to fetch raw git diff: ${redactSecrets(err)}`);
  }

  // 4. Scrub diff against ignoreDirectory and default binary/build patterns
  if (rawDiff) {
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
    diffStat,
    changedFiles,
    fileDeltas,
  };
}

/**
 * Strips diff blocks matching binary artifacts, build directories, or ignoreDirectories
 */
function scrubDiff(diff: string, ignoreDirectories: string[]): string {
  const fileDiffs = diff.split(/^diff --git /m);
  if (fileDiffs.length <= 1) return diff;

  const keptBlocks: string[] = [];

  for (const block of fileDiffs) {
    if (!block.trim()) continue;
    const firstLine = block.split('\n')[0];

    // Strip binary notices (e.g. "Binary files a/... and b/... differ")
    if (block.includes('Binary files ') && block.includes(' differ')) {
      continue;
    }

    // Extract file paths from "a/path b/path"
    const paths = firstLine.split(' ');
    const pathA = paths[0]?.replace(/^a\//, '') || '';
    const pathB = paths[1]?.replace(/^b\//, '') || '';

    if (isIgnoredPath(pathA, ignoreDirectories) || isIgnoredPath(pathB, ignoreDirectories)) {
      continue;
    }

    keptBlocks.push('diff --git ' + block);
  }

  return keptBlocks.join('\n');
}

