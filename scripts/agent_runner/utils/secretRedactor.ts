/**
 * Runtime Secret Masking & Log Redaction Utility
 *
 * Prevents GitHub PATs, Gemini API keys, and Sanity tokens from leaking in
 * error messages, stack traces, or GitHub Actions workflow logs.
 */

const SECRET_ENV_KEYS = [
  'GIT_REPO_PAT_TOKEN',
  'GIT_PAT_ORGANIZATION',
  'GIT_ORG_PAT_MAP',
  'GEMINI_API_KEY',
  'SANITY_AGENT_RUNNER_TOKEN',
  'SANITY_AGENT_READ_ONLY_TOKEN',
  'SANITY_API_WRITE_TOKEN',
  'GITHUB_TOKEN',
] as const;

const dynamicSecrets = new Set<string>();

/**
 * Registers a secret with GitHub Actions log masking (`::add-mask::`) when running
 * inside GitHub Actions, and adds it to the in-process redactor set.
 */
export function maskAndRegisterSecret(secret: string | undefined): void {
  if (!secret) return;
  const trimmed = secret.trim();
  if (trimmed.length < 6) return;

  dynamicSecrets.add(trimmed);

  if (process.env.GITHUB_ACTIONS === 'true') {
    for (const line of trimmed.split(/\r?\n/)) {
      if (line.trim().length >= 6) {
        console.log(`::add-mask::${line}`);
      }
    }
  }
}

function collectConfiguredSecrets(): string[] {
  const secrets = new Set<string>(dynamicSecrets);

  for (const key of SECRET_ENV_KEYS) {
    const val = process.env[key]?.trim();
    if (val && val.length >= 6) {
      secrets.add(val);
    }
  }

  for (const [key, val] of Object.entries(process.env)) {
    if (key.startsWith('GIT_PAT_') && val && val.trim().length >= 6) {
      secrets.add(val.trim());
    }
  }

  // Sort longest-first to avoid partial replacement leaving fragments
  return Array.from(secrets).sort((a, b) => b.length - a.length);
}

/**
 * Formats an unknown error or string and strips all known secrets, GitHub PAT formats,
 * Bearer headers, and query-string API keys.
 */
export function redactSecrets(input: unknown): string {
  let raw: string;
  if (input instanceof Error) {
    raw = input.stack ? `${input.name}: ${input.message}\n${input.stack}` : `${input.name}: ${input.message}`;
  } else if (typeof input === 'string') {
    raw = input;
  } else {
    try {
      raw = JSON.stringify(input);
    } catch {
      raw = String(input);
    }
  }

  let sanitized = raw;
  for (const secret of collectConfiguredSecrets()) {
    if (sanitized.includes(secret)) {
      sanitized = sanitized.split(secret).join('[REDACTED]');
    }
  }

  // Scrub standard GitHub token prefixes, Bearer headers, and URL key parameters
  sanitized = sanitized
    .replace(/\b(github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+)\b/g, '[REDACTED_TOKEN]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+/gi, '$1[REDACTED]')
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]');

  return sanitized;
}

