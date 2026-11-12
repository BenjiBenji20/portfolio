# GitHub Actions PAT & Secret Hardening Architecture

**Date Started:** 2026-11-12  
**Status:** Active  

## 1. Overview
Documents the defense-in-depth security invariants protecting GitHub PATs (`GIT_REPO_PAT_TOKEN`, `GIT_PAT_ORGANIZATION`, `GIT_ORG_PAT_MAP`), Gemini API keys, and Sanity tokens during `.github/workflows/autonomous-devlog.yml` runs.

## 2. Workflow & Runner Security Invariants

1. **Zero Shell Interpolation (`autonomous-devlog.yml`):**
   - External inputs (`target_repo`, `commit_sha`, `base_sha`, `branch`, `pr_number`, `pr_title`, `sender`) pass strictly via `env:` and are read from `process.env` inside `index.ts`.
   - Eliminates bash command-injection vectors from crafted commit messages or PR titles.
2. **Minimal Workflow Permissions & Lockfile Installs:**
   - Top-level and job-level `permissions: contents: read`.
   - `actions/checkout@v4` enforces `persist-credentials: false` so `.git/config` holds no token on disk.
   - Dependencies install via lockfile-pinned `npm ci --legacy-peer-deps`.
3. **Owner-Scoped Least-Privilege Routing (`githubTokenResolver.ts`):**
   - Routes read requests to `GIT_PAT_ORGANIZATION` for external organizations and `GIT_REPO_PAT_TOKEN` for personal repos, keeping write permissions separated from the runner.
4. **Runtime Masking & Log Redaction (`secretRedactor.ts`):**
   - `maskAndRegisterSecret()` emits `::add-mask::` in GitHub Actions for dynamically parsed `GIT_ORG_PAT_MAP` tokens.
   - `redactSecrets()` scrubs all configured secret values, GitHub token prefixes (`github_pat_*`, `gh[pousr]_*`), `Bearer` headers, and `?key=` parameters from logged errors.
5. **Header-Only API Key Transport (`geminiService.ts`) & Path Guard (`repositoryTool.ts`):**
   - Gemini requests send `GEMINI_API_KEY` via `x-goog-api-key` header instead of URL query strings.
   - `readRepositoryFile()` enforces `path.relative` boundary checks to block sibling-prefix traversal and `.env`/`.git/` files.

