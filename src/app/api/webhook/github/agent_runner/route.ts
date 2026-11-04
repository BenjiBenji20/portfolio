import { NextResponse, type NextRequest } from 'next/server';
import type {
  GitHubPullRequestEvent,
  GitHubPushEvent,
  WorkflowDispatchInputs,
} from '@/types/githubWebhook';

/**
 * Phase 1: 1-Second Serverless Gatekeeper
 * 
 * Responsibilities:
 * 1. Cryptographically verify incoming GitHub HMAC SHA-256 signatures via Web Crypto API.
 * 2. Execute deterministic Tier 1 filtering (events, branches, bots, non-functional files).
 * 3. Normalize metadata into a compact dispatch contract.
 * 4. Trigger Stage 2 GitHub Actions runner via workflow_dispatch.
 * 5. Return HTTP 202 Accepted within < 1 second.
 */

const NON_FUNCTIONAL_EXTENSIONS = [
  '.lock',
  '.md',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
];

const NON_FUNCTIONAL_FILENAMES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  'license',
  'license.md',
  'license.txt',
];

const NON_FUNCTIONAL_PREFIXES = [
  '.github/',
  '.vscode/',
  '.idea/',
  '.agents/',
  'documentation/',
];

/**
 * Deterministically checks if a given file path is non-functional
 */
function isNonFunctionalFile(file: string): boolean {
  const normalized = file.toLowerCase();
  if (NON_FUNCTIONAL_FILENAMES.some((name) => normalized.endsWith(name))) {
    return true;
  }
  if (NON_FUNCTIONAL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }
  if (NON_FUNCTIONAL_EXTENSIONS.some((ext) => normalized.endsWith(ext))) {
    return true;
  }
  if (normalized.includes('.env')) {
    return true;
  }
  return false;
}

/**
 * Validates HMAC SHA-256 signature using the standard Web Crypto API
 */
async function verifyGitHubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureHex = signatureHeader.slice('sha256='.length);
    if (signatureHex.length % 2 !== 0) return false;

    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    const bodyBytes = encoder.encode(rawBody);

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      bodyBytes
    );
  } catch (err) {
    console.error('[Webhook Gatekeeper] Web Crypto HMAC verification error:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const deliveryId = req.headers.get('x-github-delivery') || 'unknown-delivery';
  const eventType = req.headers.get('x-github-event');
  const signatureHeader = req.headers.get('x-hub-signature-256');

  // 1. Verify environment configuration
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  const patToken = process.env.GITHUB_PAT_TOKEN;
  const portfolioOwner = process.env.PORTFOLIO_REPO_OWNER || 'BenjiBenji20';
  const portfolioRepo = process.env.PORTFOLIO_REPO_NAME || 'portfolio';

  if (!webhookSecret) {
    console.error('[Webhook Gatekeeper] Missing GITHUB_WEBHOOK_SECRET in environment.');
    return NextResponse.json(
      { error: 'Server configuration error: webhook secret missing' },
      { status: 500 }
    );
  }

  // 2. Read raw text for cryptographic verification
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to read request body', details: String(err) },
      { status: 400 }
    );
  }

  // 3. Cryptographic HMAC-SHA256 barrier
  const isSignatureValid = await verifyGitHubWebhookSignature(rawBody, signatureHeader, webhookSecret);
  if (!isSignatureValid) {
    console.warn(`[Webhook Gatekeeper] 401 Unauthorized for delivery ${deliveryId}: Invalid signature.`);
    return NextResponse.json(
      { error: 'Unauthorized: Invalid signature' },
      { status: 401 }
    );
  }

  // 4. Handle initial connection verification ping
  if (eventType === 'ping') {
    return NextResponse.json(
      { status: 'pong', message: 'GitHub Webhook handshake established successfully.' },
      { status: 200 }
    );
  }

  // 5. Parse JSON payload
  let payload: GitHubPullRequestEvent | GitHubPushEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON payload', details: String(err) },
      { status: 400 }
    );
  }

  // 6. Bot & Infinite Loop Guardrail
  const sender = payload.sender;
  if (
    sender?.type === 'Bot' ||
    sender?.login.includes('[bot]') ||
    sender?.login === 'github-actions' ||
    sender?.login === 'dependabot'
  ) {
    return NextResponse.json(
      { skipped: true, reason: `Automated commit from bot (${sender.login}) ignored` },
      { status: 200 }
    );
  }

  // 7. Event & Branch Guardrail
  let targetRepo: string;
  let commitSha: string;
  let branch: string;
  let prNumber = '';
  let prTitle = '';

  if (eventType === 'pull_request') {
    const prEvent = payload as GitHubPullRequestEvent;
    const pr = prEvent.pull_request;

    // We only process closed & merged pull requests
    if (prEvent.action !== 'closed' || !pr.merged) {
      return NextResponse.json(
        { skipped: true, reason: `PR event action '${prEvent.action}' (merged: ${pr.merged}) is not actionable` },
        { status: 200 }
      );
    }

    // Branch check (default production branch)
    const baseBranch = pr.base.ref;
    const defaultBranch = prEvent.repository.default_branch || 'main';
    if (baseBranch !== 'main' && baseBranch !== 'master' && baseBranch !== defaultBranch) {
      return NextResponse.json(
        { skipped: true, reason: `PR merged into non-production branch '${baseBranch}'` },
        { status: 200 }
      );
    }

    targetRepo = prEvent.repository.full_name;
    commitSha = pr.merge_commit_sha || pr.head.sha;
    branch = baseBranch;
    prNumber = String(pr.number);
    prTitle = pr.title ? pr.title.slice(0, 250) : `Merged PR #${pr.number}`;
  } else if (eventType === 'push') {
    const pushEvent = payload as GitHubPushEvent;

    // Ignore tag creations or branch deletions
    if (pushEvent.deleted || !pushEvent.head_commit) {
      return NextResponse.json(
        { skipped: true, reason: 'Push event has no head commit or is a branch deletion' },
        { status: 200 }
      );
    }

    const refBranch = pushEvent.ref.replace('refs/heads/', '');
    const defaultBranch = pushEvent.repository.default_branch || 'main';
    if (refBranch !== 'main' && refBranch !== 'master' && refBranch !== defaultBranch) {
      return NextResponse.json(
        { skipped: true, reason: `Push targeted non-production branch '${refBranch}'` },
        { status: 200 }
      );
    }

    // Tier 1 File Filter on push commits
    const allFiles: string[] = [];
    if (pushEvent.commits && Array.isArray(pushEvent.commits)) {
      for (const commit of pushEvent.commits) {
        if (commit.added) allFiles.push(...commit.added);
        if (commit.modified) allFiles.push(...commit.modified);
        if (commit.removed) allFiles.push(...commit.removed);
      }
    }

    if (allFiles.length > 0 && allFiles.every(isNonFunctionalFile)) {
      return NextResponse.json(
        { skipped: true, reason: 'Tier 1 filter: only non-functional file changes detected (*.lock, *.md, CI, docs)' },
        { status: 200 }
      );
    }

    targetRepo = pushEvent.repository.full_name;
    commitSha = pushEvent.head_commit.id || pushEvent.after;
    branch = refBranch;
    prTitle = (pushEvent.head_commit.message || 'Direct push to production').split('\n')[0].slice(0, 250);
  } else {
    // Unhandled event (e.g. issues, star, fork)
    return NextResponse.json(
      { skipped: true, reason: `Unhandled event type '${eventType}'` },
      { status: 200 }
    );
  }

  // 8. Verify Stage 2 PAT Authentication
  if (!patToken) {
    console.error('[Webhook Gatekeeper] GITHUB_PAT_TOKEN is not configured on the server.');
    return NextResponse.json(
      { error: 'Server configuration error: GitHub dispatch PAT missing' },
      { status: 500 }
    );
  }

  // 9. Dispatch to Stage 2 GitHub Actions Worker (autonomous-devlog.yml)
  const dispatchPayload: { ref: string; inputs: WorkflowDispatchInputs } = {
    ref: 'main',
    inputs: {
      target_repo: targetRepo,
      commit_sha: commitSha,
      branch: branch,
      pr_number: prNumber,
      pr_title: prTitle,
      sender: sender.login,
    },
  };

  const dispatchUrl = `https://api.github.com/repos/${portfolioOwner}/${portfolioRepo}/actions/workflows/autonomous-devlog.yml/dispatches`;

  try {
    // Strict 3-second timeout budget to guarantee < 1s typical response and avoid Vercel 504s
    const dispatchRes = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${patToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Benjineer-Portfolio-Gatekeeper',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dispatchPayload),
      signal: AbortSignal.timeout(3000),
    });

    if (dispatchRes.status === 204) {
      console.log(
        `[Webhook Gatekeeper] Successfully dispatched delivery ${deliveryId} for ${targetRepo}@${commitSha.slice(0, 7)}.`
      );
      return NextResponse.json(
        {
          status: 'Dispatched to Stage 2 Worker',
          delivery: deliveryId,
          target_repo: targetRepo,
          commit_sha: commitSha,
          branch: branch,
        },
        { status: 202 }
      );
    }

    const errorBody = await dispatchRes.text();
    console.error(
      `[Webhook Gatekeeper] GitHub Actions dispatch returned HTTP ${dispatchRes.status}:`,
      errorBody
    );

    return NextResponse.json(
      {
        error: 'Failed to trigger Stage 2 workflow dispatch',
        statusCode: dispatchRes.status,
        details: errorBody,
      },
      { status: 502 }
    );
  } catch (err) {
    console.error('[Webhook Gatekeeper] Dispatch fetch failed or timed out:', err);
    return NextResponse.json(
      {
        error: 'Stage 2 dispatch request failed or timed out',
        details: String(err),
      },
      { status: 504 }
    );
  }
}

