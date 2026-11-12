# Tracked Repository Setup & Webhook Onboarding Guide

**Date Started:** 2026-11-04  
**Status:** Active  

## 1. Overview
Operational procedure to enable autonomous devlog tracking on external project repositories (e.g., *Oravista*, *Incident Hound*) and route them to Benjineer Portfolio (`BenjiBenji20/portfolio`).

## 2. Step 1: Configure Portfolio Environment Variables
In your portfolio repository `.env.local` (and Vercel Project Settings > Environment Variables):
```bash
GITHUB_WEBHOOK_SECRET="your_shared_webhook_secret_here" # Shared secret string
GIT_REPO_PAT_TOKEN="github_pat_... or ghp_..."          # Token with Actions workflow dispatch
PORTFOLIO_REPO_OWNER="BenjiBenji20"
PORTFOLIO_REPO_NAME="portfolio"
```
> [!NOTE]
> **Least-Privilege PAT Scopes:**
> - **Vercel (`GIT_REPO_PAT_TOKEN`):** Fine-grained PAT on `portfolio` repo (`Actions: Read and write` for `workflow_dispatch`).
> - **GitHub Actions (`GIT_REPO_PAT_TOKEN`):** Read-only fine-grained PAT (`Contents: Read-only`, `Pull requests: Read-only`) for selected personal tracked repos.
> - **GitHub Actions (`GIT_PAT_ORGANIZATION`):** Read-only fine-grained PAT owned by your external organization (`Contents: Read-only`, `Pull requests: Read-only`). *(Optional: `GIT_ORG_PAT_MAP` JSON for multiple orgs simultaneously.)*

## 3. Step 2: Register the Webhook in the Tracked Repo
In the repository you want to track:
1. Navigate to **Settings > Webhooks > Add webhook**.
2. **Payload URL:** `https://<YOUR-PORTFOLIO-DOMAIN>/api/webhook/github/agent_runner` (e.g. `https://your-portfolio.vercel.app/api/webhook/github/agent_runner`).
3. **Content type:** `application/json` *(Do not use application/x-www-form-urlencoded)*.
4. **Secret:** The same secret string configured in `GITHUB_WEBHOOK_SECRET`.
5. **SSL verification:** Enable SSL verification.
6. **Events:** Select **Let me select individual events** -> Check **Pushes** and **Pull requests**.
7. Click **Add webhook**. Confirm the initial `ping` event delivers with a green checkmark (`200 OK`).

## 4. Step 3: Add Config File to the Tracked Repo Root
Create `.portfolio.json` (or `<project_name>.portfolio.json` / `portfolio.json`) in the root of the main branch (EXAMPLE):
```json
{
  "track": true,
  "$schema": "https://benjibenji20.dev/schemas/portfolio.v1.json",
  "requireHumanApproval": true,
  "note": "Optional custom author instructions for Gemini",
  "ignoreDirectory": ["/public/assets/"],
  "projectTitle": "Incident Hound",
  "projectSlug": "incident-hound",
  "category": "Backend Systems",
  "liveUrl": "https://incident-hound.demo.dev",
  "primaryBranch": "main",
  "mediaPreferences": {
    "captureScreenshots": true,
    "generateArchitectureDiagrams": true
  }
}
```

## 5. Verification & Diagnostics
- **Immediate Skip Verification:** Pushing only `.md`, lockfiles, `__pycache__`, or `dist/` returns `200 OK` (skipped) in GitHub Webhook Deliveries.
- **Workflow Dispatch:** Merging functional code into `main` returns `202 Accepted` and launches the GitHub Actions runner.
