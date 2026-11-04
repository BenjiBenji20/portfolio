import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 1 Webhook Testing Utility
 * 
 * Simulates GitHub Webhook events with cryptographic HMAC-SHA256 signatures.
 * Automatically loads GITHUB_WEBHOOK_SECRET from .env.local or .env if present.
 */

function resolveSecret(): string {
  if (process.env.GITHUB_WEBHOOK_SECRET) {
    return process.env.GITHUB_WEBHOOK_SECRET;
  }

  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const match = content.match(/^GITHUB_WEBHOOK_SECRET=["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  return 'test_webhook_secret_123';
}

const TARGET_URL = process.argv[2] || process.env.WEBHOOK_TEST_URL || 'http://localhost:3000/api/webhook/github/agent_runner';
const SECRET = resolveSecret();

function computeSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

async function sendWebhook(
  event: string,
  payload: Record<string, unknown>,
  customSecret?: string
) {
  const rawBody = JSON.stringify(payload);
  const signature = computeSignature(rawBody, customSecret ?? SECRET);

  const res = await fetch(TARGET_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-github-event': event,
      'x-github-delivery': crypto.randomUUID(),
      'x-hub-signature-256': signature,
      'User-Agent': 'GitHub-Hookshot/test',
    },
    body: rawBody,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, body: json };
}

async function runTests() {
  console.log(`\n========================================================`);
  console.log(`Phase 1 Gatekeeper Comprehensive Verification Suite`);
  console.log(`Target URL: ${TARGET_URL}`);
  console.log(`Using Secret: ${SECRET.slice(0, 4)}*** (length: ${SECRET.length})`);
  console.log(`========================================================\n`);

  // Test 1: Ping event
  console.log(`[Test 1] Ping Handshake (Expect 200 OK - pong)...`);
  const pingRes = await sendWebhook('ping', {
    zen: 'Keep it logically awesome.',
    hook_id: 123456789,
  });
  console.log(`Status: ${pingRes.status}`, pingRes.body);

  // Test 2: Invalid HMAC Signature
  console.log(`\n[Test 2] Security Barrier - Invalid Signature (Expect 401 Unauthorized)...`);
  const invalidSigRes = await sendWebhook(
    'push',
    { repository: { full_name: 'BenjiBenji20/oravista' } },
    'wrong_secret_deliberately_invalid'
  );
  console.log(`Status: ${invalidSigRes.status}`, invalidSigRes.body);

  // Test 3: Bot Sender Filtering
  console.log(`\n[Test 3] Bot Filter (Expect 200 OK - Skipped)...`);
  const botRes = await sendWebhook('push', {
    ref: 'refs/heads/main',
    repository: { full_name: 'BenjiBenji20/oravista', default_branch: 'main' },
    sender: { login: 'dependabot[bot]', type: 'Bot', id: 49699333 },
    head_commit: { id: 'abc1234', message: 'Bump fast-api from 0.110 to 0.111' },
    commits: [],
  });
  console.log(`Status: ${botRes.status}`, botRes.body);

  // Test 4: Tier 1 Non-Functional Files Only (.md / .lock)
  console.log(`\n[Test 4] Tier 1 File Filter - Only .md & .lock (Expect 200 OK - Skipped)...`);
  const docsRes = await sendWebhook('push', {
    ref: 'refs/heads/main',
    repository: { full_name: 'BenjiBenji20/oravista', default_branch: 'main' },
    sender: { login: 'BenjiBenji20', type: 'User', id: 12345 },
    head_commit: { id: 'def5678', message: 'docs: update README.md and lockfile' },
    commits: [
      {
        id: 'def5678',
        message: 'docs: update README.md and lockfile',
        added: [],
        modified: ['README.md', 'package-lock.json'],
        removed: [],
      },
    ],
  });
  console.log(`Status: ${docsRes.status}`, docsRes.body);

  // Test 5: PR closed but NOT merged
  console.log(`\n[Test 5] PR Closed without Merging (Expect 200 OK - Skipped)...`);
  const unmergedRes = await sendWebhook('pull_request', {
    action: 'closed',
    number: 10,
    pull_request: {
      id: 1111,
      number: 10,
      title: 'feat: experimental branch discarded',
      state: 'closed',
      merged: false,
      base: { ref: 'main' },
      head: { ref: 'experiment', sha: 'aaa111' },
      user: { login: 'BenjiBenji20', type: 'User', id: 12345 },
    },
    repository: { name: 'oravista', full_name: 'BenjiBenji20/oravista', default_branch: 'main' },
    sender: { login: 'BenjiBenji20', type: 'User', id: 12345 },
  });
  console.log(`Status: ${unmergedRes.status}`, unmergedRes.body);

  // Test 6: PR merged to non-production branch (e.g. develop or feature)
  console.log(`\n[Test 6] PR Merged to Non-Production Branch (Expect 200 OK - Skipped)...`);
  const featureBranchRes = await sendWebhook('pull_request', {
    action: 'closed',
    number: 11,
    pull_request: {
      id: 2222,
      number: 11,
      title: 'feat: merge to staging branch',
      state: 'closed',
      merged: true,
      merge_commit_sha: 'bbb222',
      base: { ref: 'staging' },
      head: { ref: 'feat/stg', sha: 'ccc333' },
      user: { login: 'BenjiBenji20', type: 'User', id: 12345 },
    },
    repository: { name: 'oravista', full_name: 'BenjiBenji20/oravista', default_branch: 'main' },
    sender: { login: 'BenjiBenji20', type: 'User', id: 12345 },
  });
  console.log(`Status: ${featureBranchRes.status}`, featureBranchRes.body);

  // Test 7: Direct push to main with functional code
  console.log(`\n[Test 7] Direct Push to main with functional code (Dispatches to Stage 2)...`);
  const pushFunctionalRes = await sendWebhook('push', {
    ref: 'refs/heads/main',
    repository: { name: 'oravista', full_name: 'BenjiBenji20/oravista', default_branch: 'main' },
    sender: { login: 'BenjiBenji20', type: 'User', id: 12345 },
    head_commit: { id: '9988776655', message: 'feat(api): implement vector indexing pipeline' },
    commits: [
      {
        id: '9988776655',
        message: 'feat(api): implement vector indexing pipeline',
        added: ['src/services/qdrant.py'],
        modified: ['src/main.py'],
        removed: [],
      },
    ],
  });
  console.log(`Status: ${pushFunctionalRes.status}`, pushFunctionalRes.body);

  // Test 8: Valid Functional PR Merge Event to main
  console.log(`\n[Test 8] Merged PR to main with functional changes (Dispatches to Stage 2)...`);
  const prRes = await sendWebhook('pull_request', {
    action: 'closed',
    number: 42,
    pull_request: {
      id: 99887766,
      number: 42,
      title: 'feat: add ResNet-50 embedding cache pipeline',
      state: 'closed',
      merged: true,
      merge_commit_sha: '8f3a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
      base: { ref: 'main' },
      head: { ref: 'feat/resnet-cache', sha: '11223344' },
      user: { login: 'BenjiBenji20', type: 'User', id: 12345 },
    },
    repository: {
      name: 'oravista',
      full_name: 'BenjiBenji20/oravista',
      default_branch: 'main',
    },
    sender: { login: 'BenjiBenji20', type: 'User', id: 12345 },
  });
  console.log(`Status: ${prRes.status}`, prRes.body);

  console.log(`\n========================================================`);
  console.log(`Test Run Complete.`);
  console.log(`========================================================\n`);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
});
