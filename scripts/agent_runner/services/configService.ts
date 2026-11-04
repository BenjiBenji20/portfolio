import { DynamicPortfolioConfigSchema, type ValidatedPortfolioConfig } from '../types';

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
  const defaultUrl = `https://api.github.com/repos/${targetRepo}/contents/.portfolio.json?ref=${commitSha}`;
  console.log(`[ConfigService] Checking for .portfolio.json in ${targetRepo}@${commitSha.slice(0, 7)}...`);

  let rawConfigString: string | null = null;
  let matchedConfigPath = '.portfolio.json';

  try {
    const defaultRes = await fetch(defaultUrl, { headers, signal: AbortSignal.timeout(30000) });
    if (defaultRes.ok) {
      rawConfigString = await defaultRes.text();
    } else if (defaultRes.status === 404) {
      // 2. Fallback: Search repo root for flexible config patterns (e.g. project_name.portfolio.json or portfolio.json)
      console.log(`[ConfigService] .portfolio.json not found directly. Searching root directory for *.portfolio.json variants...`);
      const contentsUrl = `https://api.github.com/repos/${targetRepo}/contents?ref=${commitSha}`;
      const listHeaders = { ...headers, Accept: 'application/vnd.github+json' };
      const listRes = await fetch(contentsUrl, { headers: listHeaders, signal: AbortSignal.timeout(30000) });

      if (listRes.ok) {
        const rootItems = (await listRes.json()) as Array<{ name: string; type: string; path: string }>;
        const candidate = rootItems.find(
          (item) => item.type === 'file' && (item.name.toLowerCase().endsWith('.portfolio.json') || item.name.toLowerCase() === 'portfolio.json')
        );

        if (candidate) {
          console.log(`[ConfigService] Discovered matching config file: "${candidate.name}". Fetching contents...`);
          matchedConfigPath = candidate.path;
          const candidateUrl = `https://api.github.com/repos/${targetRepo}/contents/${encodeURIComponent(candidate.path)}?ref=${commitSha}`;
          const candidateRes = await fetch(candidateUrl, { headers, signal: AbortSignal.timeout(30000) });
          if (candidateRes.ok) {
            rawConfigString = await candidateRes.text();
          }
        }
      }
    } else {
      console.error(`[ConfigService] GitHub API error (HTTP ${defaultRes.status}): ${await defaultRes.text()}`);
      return null;
    }

    if (!rawConfigString) {
      console.warn(`[ConfigService] No *.portfolio.json configuration file discovered in ${targetRepo}. Skipping.`);
      return null;
    }

    const rawJson = JSON.parse(rawConfigString);
    const parseResult = DynamicPortfolioConfigSchema.safeParse(rawJson);

    if (!parseResult.success) {
      console.error(`[ConfigService] Validation failed for "${matchedConfigPath}" in ${targetRepo}:`);
      console.error(parseResult.error.format());
      return null;
    }

    const config = parseResult.data as ValidatedPortfolioConfig;

    // Detect and log dynamic custom keys
    const standardKeys = new Set([
      'track',
      'schema',
      '$schema',
      'requireHumanApproval',
      'note',
      'ignoreDirectory',
      'projectTitle',
      'projectSlug',
      'category',
      'liveUrl',
      'primaryBranch',
      'mediaPreferences',
    ]);

    const customKeys = Object.keys(config).filter((k) => !standardKeys.has(k));
    if (customKeys.length > 0) {
      console.log(`[ConfigService] Discovered ${customKeys.length} dynamic custom key(s):`, customKeys);
    }

    return config;
  } catch (err) {
    console.error(`[ConfigService] Error fetching or parsing configuration file:`, err);
    return null;
  }
}

