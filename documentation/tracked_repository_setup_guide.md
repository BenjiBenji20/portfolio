# Tracked Repository Setup & Webhook Onboarding Guide

**Date Started:** 2026-11-04  
**Status:** Active  

## 1. Overview
Operational playbook to connect an external project repository (e.g., *Oravista*, *Incident Hound*) to the Benjineer Portfolio (`BenjiBenji20/portfolio`) Phase 1 Agentic Webhook Intake.

## 2. Step A: Configure Environment Variables in Portfolio
Add to `.env.local` (and Vercel Project Settings > Environment Variables):
```bash
GITHUB_WEBHOOK_SECRET="your_shared_webhook_secret_here" # Random 32+ char secret
GIT_REPO_PAT_TOKEN="ghp_... or github_pat_..."           # Token with workflow/Actions scope
PORTFOLIO_REPO_OWNER="BenjiBenji20"
PORTFOLIO_REPO_NAME="portfolio"
```
> **PAT Generation:** GitHub Settings > Developer Settings > Personal Access Tokens:
> - **Option 1 (Classic):** Select `workflow` scope.
> - **Option 2 (Fine-Grained):** Target repo `portfolio` -> Repository permissions -> `Actions: Read and write`.

## 3. Step B: Register Webhook in Tracked Repositories
In each tracked repository (e.g., `BenjiBenji20/oravista`):
1. Navigate to **Settings > Webhooks > Add webhook**.
2. **Payload URL:** `https://<PORTFOLIO-DOMAIN>/api/webhook/github/agent_runner`
3. **Content type:** `application/json` *(Do not use form-urlencoded)*.
4. **Secret:** Exact value of `GITHUB_WEBHOOK_SECRET`.
5. **SSL verification:** Enable.
6. **Events:** Select **Let me select individual events** -> Check **Pushes** and **Pull requests**.
7. Click **Add webhook**. Confirm the initial `ping` returns a green checkmark (`200 OK`).

## 4. Step C: Add `.portfolio.json` to Tracked Repo Root
Commit `.portfolio.json` to the root of the default production branch (`main`):
```json
{
  "track": true,
  "$schema": "https://benjibenji20.dev/schemas/portfolio.v1.json",
  "requireHumanApproval": true,
  "note": "Do not make your blog super technical",
  "ignoreDirectory": ["/public/assets/"],
  "projectTitle": "Incident Hound",
  "projectSlug": "incident-hound",
  "category": "Backend Systems & Observability",
  "liveUrl": "https://incident-hound.demo.dev",
  "primaryBranch": "main",
  "mediaPreferences": {
    "captureScreenshots": false,
    "generateArchitectureDiagrams": true
  }
}
```

## 5. Verification Checklist
- Run local simulation suite: `npx tsx scripts/test_webhook_intake.ts`
- In GitHub Webhooks, inspect **Recent Deliveries** for `200 OK` (ping/skips) or `202 Accepted` (dispatches).

