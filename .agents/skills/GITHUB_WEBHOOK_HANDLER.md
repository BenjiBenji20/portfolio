# GitHub Webhook Intake, HMAC Security & Workflow Dispatch

> **Overview:** Procedural instructions for the Agentic Dev to build a secure Next.js Route Handler (Stage 1 Gatekeeper) that verifies incoming GitHub payloads, executes deterministic Tier 1 filtering, extracts event metadata, and triggers the Stage 2 GitHub Actions worker via `workflow_dispatch` within strict serverless timeout budgets.  
> **When to Use:** Consult when implementing or updating `/app/api/webhook/github/**/route.ts`, configuring webhook and PAT secrets, structuring Tier 1 file filters, or wiring the GitHub REST API dispatch handoff.

---

## 1. Web Crypto HMAC Verification Directives
- **Raw Body Handling:** Always capture the incoming request body as raw text (`await req.text()`) before performing any JSON parsing. Never reconstruct or re-stringify JSON objects for verification, as character whitespace alterations will break signature matches.
- **Header Extraction:** Retrieve the `x-hub-signature-256` header directly from the request. If the header is missing, malformed, or does not begin with the `sha256=` prefix, reject the request immediately with an HTTP 401 status.
- **Signature Computation:**
  - Convert the shared `GITHUB_WEBHOOK_SECRET` and raw text payload into byte buffers using standard `TextEncoder`.
  - Compute an HMAC digest using the SHA-256 algorithm via the runtime's native Web Crypto API (`crypto.subtle`).
  - Format the resulting digest as a lowercase hexadecimal string prefixed with `sha256=`.
- **Timing-Safe Comparison:** Compare the computed signature against the incoming header using a constant-time comparison algorithm (`crypto.subtle.timingSafeEqual` or byte-wise XOR loop) to prevent side-channel timing attacks. Avoid standard string equality operators (`===`).

---

## 2. Event Filtering, Tier 1 Triage & Payload Extraction Directives
- **Event Header Inspection:** Read the `x-github-event` header. Explicitly handle `push`, `pull_request` (specifically when `action === "closed"` and `pull_request.merged === true`), and `release` events. For all other event types (e.g., `ping`, `issues`, `star`, unmerged PR actions), acknowledge receipt immediately with an HTTP 200 status and exit early.
- **Bot & Loop Guardrail:** Inspect the sender and commit author metadata (`sender.type === "Bot"` or username matching `dependabot[bot]`, `github-actions[bot]`). Immediately ignore automated commits with an HTTP 200 skip response to prevent infinite automation loops.
- **Branch Guardrail:** Verify that the target branch (`ref` for push, `base.ref` for merged PRs) matches the repository's default/primary branch (`main` or `master`). Ignore pushes or merges to feature branches and return an HTTP 200 status with a descriptive skip message so GitHub does not flag failed deliveries.
- **Tier 1 Deterministic File Filter:**
  - Aggregate the `added`, `modified`, and `removed` file path arrays across the payload's commits.
  - Evaluate file extensions and paths against deterministic exclusion rules (`*.lock`, `package-lock.json`, `pnpm-lock.yaml`, `*.md`, `.gitignore`, `.env*`, `.github/**`, `.vscode/**`).
  - If the change set modifies *exclusively* excluded non-functional files, terminate processing early and return an HTTP 200 status with `{ skipped: true, reason: "Tier 1 filter: non-functional file changes only" }`.
- **Payload Normalization & PR Context Extraction:**
  - Do not forward the raw, heavy GitHub webhook payload downstream. Extract and normalize only the compact operational fields required by the Stage 2 worker:
    - `target_repo`: Full repository name (`owner/repo`).
    - `commit_sha`: Head commit SHA (`after` or `merge_commit_sha`).
    - `branch`: Target primary branch name.
    - `pr_title`: The `pull_request.title` (if triggered via PR merge) or the primary line of `head_commit.message`.
    - `pr_body`: The `pull_request.body` (if triggered via PR merge) or the extended commit body, truncated to a safe character ceiling to fit GitHub API dispatch input limits.

---

## 3. Stage 2 Handoff (`workflow_dispatch`) & Timeout Discipline
- **The 1.5-Second Gatekeeper Budget:** Execute HMAC verification, Tier 1 filtering, and the outbound dispatch call well within a 1.5-second window to avoid Vercel Hobby tier 10-second execution timeouts.
- **GitHub Actions `workflow_dispatch` Trigger:**
  - Instead of running git diff downloads, Playwright browsers, or Gemini synthesis inside the serverless function, hand off execution to the portfolio repository's Stage 2 GitHub Actions runner.
  - Issue an authenticated HTTP `POST` request to the GitHub REST API:
    `https://api.github.com/repos/<portfolio_owner>/<portfolio_repo>/actions/workflows/autonomous-devlog.yml/dispatches`
  - Authenticate using a fine-grained Personal Access Token (`GITHUB_PAT_TOKEN`) with `Actions: Read and Write` scope via the `Authorization: Bearer` header, alongside `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`.
  - Pass the normalized metadata inside the JSON body under `ref: "main"` and `inputs: { target_repo, commit_sha, branch, pr_title, pr_body }`.
- **Fast-Acknowledgment Response:**
  - Once the GitHub API responds with HTTP `204 No Content` (confirming the workflow was queued), immediately return an HTTP `202 Accepted` response (`{ status: "Dispatched to Stage 2 Worker" }`) and close the serverless invocation.
- **Security Isolation:** Keep both `GITHUB_WEBHOOK_SECRET` and `GITHUB_PAT_TOKEN` strictly in server-side environment variables. Never expose them to client bundles, log outputs, or error payloads returned to the caller.