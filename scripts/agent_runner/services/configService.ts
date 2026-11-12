import { DynamicPortfolioConfigSchema, type ValidatedPortfolioConfig } from '../types';

const IGNORED_TREE_PREFIXES = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', 'venv/', '.venv/'];

function isMatchingPortfolioConfigFile(filePath: string): boolean {
  const fileName = (filePath.split('/').pop() || filePath).toLowerCase();
  return fileName.endsWith('.portfolio.json') || fileName === 'portfolio.json';
}

function encodeGitHubContentPath(filePath: string): string {
  return filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function fetchRepoFileRaw(
  targetRepo: string,
  filePath: string,
  commitSha: string,
  headers: Record<string, string>
): Promise<{ ok: boolean; status: number; text: string }> {
  const encodedPath = encodeGitHubContentPath(filePath);
  const url = `https://api.github.com/repos/${targetRepo}/contents/${encodedPath}?ref=${commitSha}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function discoverConfigPathInRepo(
  targetRepo: string,
  commitSha: string,
  headers: Record<string, string>
): Promise<string | null> {
  const jsonHeaders = { ...headers, Accept: 'application/vnd.github+json' };
  const contentsUrl = `https://api.github.com/repos/${targetRepo}/contents?ref=${commitSha}`;
  const listRes = await fetch(contentsUrl, { headers: jsonHeaders, signal: AbortSignal.timeout(30000) });

  if (!listRes.ok) {
    // Distinguish missing config file from private/org repository access failures
    const repoCheckRes = await fetch(`https://api.github.com/repos/${targetRepo}`, {
      headers: jsonHeaders,
      signal: AbortSignal.timeout(15000),
    });

    if (!repoCheckRes.ok) {
      console.error(
        `[ConfigService] Repository "${targetRepo}" returned HTTP ${repoCheckRes.status}. ` +
          `If this is a private or external organization repository, verify GIT_REPO_PAT_TOKEN has "Contents: Read" access to "${targetRepo}".`
      );
    } else {
      console.error(
        `[ConfigService] Failed to list root directory for "${targetRepo}@${commitSha.slice(0, 7)}" (HTTP ${listRes.status}).`
      );
    }
    return null;
  }

  const rootItems = (await listRes.json()) as Array<{ name: string; type: string; path: string }>;
  const rootCandidate = rootItems.find(
    (item) => item.type === 'file' && isMatchingPortfolioConfigFile(item.name)
  );
  if (rootCandidate) {
    return rootCandidate.path;
  }

  // Fallback: Search repository tree for subdirectory *.portfolio.json / portfolio.json
  const treeUrl = `https://api.github.com/repos/${targetRepo}/git/trees/${commitSha}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers: jsonHeaders, signal: AbortSignal.timeout(30000) });
  if (treeRes.ok) {
    const treeJson = (await treeRes.json()) as {
      truncated?: boolean;
      tree?: Array<{ path: string; type: string }>;
    };
    const treeEntries = Array.isArray(treeJson.tree) ? treeJson.tree : [];
    const subCandidate = treeEntries.find(
      (entry) =>
        entry.type === 'blob' &&
        !IGNORED_TREE_PREFIXES.some((prefix) => entry.path.toLowerCase().startsWith(prefix)) &&
        isMatchingPortfolioConfigFile(entry.path)
    );
    if (subCandidate) {
      return subCandidate.path;
    }
  }

  const visibleRootFiles = rootItems.map((item) => item.name).slice(0, 15).join(', ');
  console.warn(
    `[ConfigService] Root files inspected at ${commitSha.slice(0, 7)}: [${visibleRootFiles || 'none'}]`
  );
  return null;
}

/**
 * Service to fetch and dynamically validate .portfolio.json (or *.portfolio.json / portfolio.json)
 * from the tracked repository.
 */
export async function fetchPortfolioConfig(
  targetRepo: string,
  commitSha: string,
  githubToken?: string
): Promise<ValidatedPortfolioConfig | null> {
  const token = githubToken || process.env.GIT_REPO_PAT_TOKEN || process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw+json',
    'User-Agent': 'Benjineer-Agent-Runner',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 1. First probe standard `.portfolio.json` directly at root (fastest: 1 API call)
  console.log(`[ConfigService] Checking for .portfolio.json in ${targetRepo}@${commitSha.slice(0, 7)}...`);

  let rawConfigString: string | null = null;
  let matchedConfigPath = '.portfolio.json';

  try {
    const defaultRes = await fetchRepoFileRaw(targetRepo, '.portfolio.json', commitSha, headers);
    if (defaultRes.ok) {
      rawConfigString = defaultRes.text;
    } else if (defaultRes.status === 404) {
      // 2. Fallback: Search root directory and recursive tree for *.portfolio.json or portfolio.json variants
      console.log(
        `[ConfigService] .portfolio.json not found directly. Searching repository for *.portfolio.json / portfolio.json variants...`
      );
      const discoveredPath = await discoverConfigPathInRepo(targetRepo, commitSha, headers);

      if (discoveredPath) {
        console.log(`[ConfigService] Discovered matching config file: "${discoveredPath}". Fetching contents...`);
        matchedConfigPath = discoveredPath;
        const candidateRes = await fetchRepoFileRaw(targetRepo, discoveredPath, commitSha, headers);
        if (candidateRes.ok) {
          rawConfigString = candidateRes.text;
        } else {
          console.error(
            `[ConfigService] Failed to download "${discoveredPath}" (HTTP ${candidateRes.status}).`
          );
        }
      }
    } else {
      console.error(`[ConfigService] GitHub API error (HTTP ${defaultRes.status}): ${defaultRes.text}`);
      return null;
    }

    if (!rawConfigString) {
      console.warn(`[ConfigService] No *.portfolio.json configuration file discovered in ${targetRepo}. Skipping.`);
      return null;
    }

    // Strip single-line and multi-line comments (JSONC support) while preserving string literals
    const withoutComments = rawConfigString.replace(
      /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
      (m, g) => (g ? '' : m)
    );

    // Strip trailing commas before closing braces/brackets (JSON5 / relaxed JSON tolerance)
    const cleanedConfigString = withoutComments.replace(
      /\\"|"(?:\\"|[^"])*"|(,\s*([}\]]))/g,
      (m, g, closing) => (g ? closing : m)
    );

    const rawJson: unknown = JSON.parse(cleanedConfigString);
    const parseResult = DynamicPortfolioConfigSchema.safeParse(rawJson);

    if (!parseResult.success) {
      console.error(`[ConfigService] Validation failed for "${matchedConfigPath}" in ${targetRepo}:`);
      const formatted = parseResult.error.format();
      console.error(JSON.stringify(formatted, null, 2));
      return null;
    }

    const config = parseResult.data as ValidatedPortfolioConfig;

    // Log Governance Invariants (Tier 1)
    console.log(
      `[ConfigService] Governance: track=${config.track} | requireHumanApproval=${config.requireHumanApproval} | primaryBranch=${config.primaryBranch}`
    );
    console.log(
      `[ConfigService] Media: screenshots=${config.mediaPreferences.captureScreenshots} | diagrams=${config.mediaPreferences.generateArchitectureDiagrams}`
    );

    // Operational Keys (Tier 2): Check human override vs Agent Autonomy
    if (config.projectTitle) {
      console.log(
        `[ConfigService] Project Title (Human Override): "${config.projectTitle}" (slug: ${config.projectSlug || 'derived'})`
      );
    } else {
      console.log(
        `[ConfigService] Project Title: [Agent Autonomy] Missing from config. Agent will synthesize title and slug.`
      );
    }

    if (config.category) {
      console.log(`[ConfigService] Category (Human Override): "${config.category}"`);
    } else {
      console.log(`[ConfigService] Category: [Agent Autonomy] Missing from config. Agent will classify stack category.`);
    }

    // Communication Bridge (Tier 3)
    if (config.projectOverview) {
      console.log(
        `[ConfigService] Standing Overview: "${config.projectOverview.slice(0, 80)}${config.projectOverview.length > 80 ? '...' : ''}"`
      );
    }
    if (config.developerDirective) {
      console.log(`[ConfigService] Developer Directive (Current Run): "${config.developerDirective}"`);
    }
    if (config.targetAudience) {
      console.log(`[ConfigService] Target Audience: "${config.targetAudience}"`);
    }

    // Detect and log dynamic custom keys (Tier 4)
    const recognizedKeys = new Set([
      'track',
      'requireHumanApproval',
      'requiredHumanApproval',
      'mediaPreferences',
      'primaryBranch',
      'projectTitle',
      'projectSlug',
      'category',
      'liveUrl',
      'ignoreDirectory',
      'projectOverview',
      'developerDirective',
      'targetAudience',
      'schema',
      '$schema',
      'note',
      'projectSummary',
      'userMessage',
      'focusDirective',
      'customAudience',
    ]);

    const customKeys = Object.keys(config).filter((k) => !recognizedKeys.has(k));
    if (customKeys.length > 0) {
      console.log(`[ConfigService] Discovered ${customKeys.length} dynamic custom key(s):`, customKeys);
    }

    return config;
  } catch (err) {
    console.error(`[ConfigService] Error fetching or parsing configuration file:`, err);
    return null;
  }
}
