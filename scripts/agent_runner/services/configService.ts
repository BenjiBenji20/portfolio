import { DynamicPortfolioConfigSchema, type ValidatedPortfolioConfig } from '../types';

/**
 * Service to fetch and dynamically validate .portfolio.json from the tracked repository
 */
export async function fetchPortfolioConfig(
  targetRepo: string,
  commitSha: string,
  githubToken?: string
): Promise<ValidatedPortfolioConfig | null> {
  const token = githubToken || process.env.GIT_REPO_PAT_TOKEN || process.env.GITHUB_TOKEN;
  const url = `https://api.github.com/repos/${targetRepo}/contents/.portfolio.json?ref=${commitSha}`;

  console.log(`[ConfigService] Fetching .portfolio.json from ${targetRepo}@${commitSha.slice(0, 7)}...`);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw+json',
    'User-Agent': 'Benjineer-Agent-Runner',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

    if (res.status === 404) {
      console.warn(`[ConfigService] .portfolio.json not found in repository ${targetRepo}. Skipping.`);
      return null;
    }

    if (!res.ok) {
      console.error(`[ConfigService] Failed to fetch .portfolio.json (HTTP ${res.status}): ${await res.text()}`);
      return null;
    }

    const rawJson = await res.json();
    const parseResult = DynamicPortfolioConfigSchema.safeParse(rawJson);

    if (!parseResult.success) {
      console.error(`[ConfigService] Validation failed for .portfolio.json in ${targetRepo}:`);
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
    console.error(`[ConfigService] Error fetching or parsing .portfolio.json:`, err);
    return null;
  }
}

