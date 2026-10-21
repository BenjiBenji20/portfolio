# Webhook Intake & Triage Specification

> **Overview:** Specifies the implementation pattern for GitHub webhook ingestion and the multi-tier filtering pipeline, ensuring dev agents build secure, low-latency endpoints that discard irrelevant commits before triggering generation.  
> **When to Use:** Reference when implementing `/app/api/webhooks/github/`, HMAC signature validation, commit payload typing, or triage evaluation gates.

---

## 1. Intake Endpoint & Signature Verification
- **Route Location:** `/app/api/webhooks/github/route.ts` (Next.js App Router POST handler).
- **Security Barrier:** Compute HMAC SHA-256 against raw request body using `GITHUB_WEBHOOK_SECRET`; reject mismatches immediately with `401 Unauthorized`.
- **Fast Ack Pattern:** Complete Tier 1 and Tier 2 evaluations synchronously. Return `200 OK` or `202 Accepted` within 3 seconds to avoid GitHub delivery timeouts.

## 2. Tier 1: Deterministic Filter (Zero Compute Cost)
- **Branch Restriction:** Process only pushes targeting default branches (`main`, `master`) or tagged release events.
- **Bot Elimination:** Drop events where the commit author matches known bot patterns (`dependabot[bot]`, `renovate[bot]`, `github-actions[bot]`).
- **Filetype Exclusion:** Bail out if the modified file set contains only lockfiles, dotfiles, CI workflows, or pure markdown documentation edits.

## 3. Tier 2: Significance & Configuration Heuristics
- **Explicit Opt-in Contract:** Check repository root for `.portfolio.json`. If absent or `"track": false`, drop the payload.
- **Diff Thresholds:** Require meaningful change volume (e.g., net additions/deletions $\ge 30$ lines across primary source extensions).
- **Commit Semantics:** Prioritize commits prefixed with conventional milestones (`feat:`, `refactor:`, `perf:`, or breaking change flags).

## 4. Tier 3: LLM Editorial Triage Gate
- **Execution Target:** Run lightweight classification via Gemini Flash only if Tiers 1 and 2 pass.
- **Triage Prompt Contract:** Enforce structured boolean output:
  `{ "publishable": boolean, "score": number, "rationale": string }`.
- **Threshold Rule:** Proceed to generation engine only when `publishable == true` and `score >= 7`; otherwise, log the triage rationale and exit gracefully.