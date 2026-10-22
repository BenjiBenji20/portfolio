# System Topology & Infrastructure Constraints

## 1. Core Architecture
- **Paradigm:** Serverless monorepo; zero dedicated 24/7 background servers.
- **CMS & Content Lake:** Sanity.io embedded directly via Next.js route (`/studio`).
- **AI Processing:** Google Gemini API invoked inside route handlers or CI runners.
- **Event Ingestion:** GitHub repository push, PR merge, and release webhooks.

## 2. Codebase Directory Layout & Route Encapsulation
```text
├── src/
│   ├── app/
│   │   ├── (portfolio)/          # Portfolio pages wrapped by global AppShell (HeaderNav + ProfileSidebar)
│   │   │   ├── layout.tsx        # Mounts <AppShell>{children}</AppShell>
│   │   │   ├── page.tsx          # Home route (/)
│   │   │   ├── projects/         # Projects index (/projects)
│   │   │   └── blogs/            # Blogs & DevLogs (/blogs)
│   │   ├── studio/[[...tool]]/   # Embedded Sanity Studio route (bypasses AppShell for full-screen workspace)
│   │   ├── api/
│   │   │   ├── chat/             # Visitor grounding and RAG route handler
│   │   │   └── webhooks/github/  # Intake endpoint for incoming repo events
│   │   └── layout.tsx            # Minimal root HTML/body shell with Geist font tokens
│   ├── components/layout/        # HeaderNav, ProfileSidebar, AppShell
│   └── sanity/
│       ├── schemas/              # Document types (profile, projects, devlogs)
│       └── lib/                  # Sanity client, mutations, image helper, GROQ queries
├── lib/
│   ├── ai/                       # Gemini SDK setup, system prompts, schema parsers
│   └── github/                   # HMAC verification, payload typing, diff extractors
└── .agents/                      # Technical specs guiding dev agents
```

## 3. Communication & Service Flow

1. **Intake:** GitHub fires `push` or `release` event -> `/api/webhooks/github`.
2. **Verification:** Route handler validates `x-hub-signature-256` with webhook secret.
3. **Execution Split:**
* Fast triage, diff parsing, and DevLog generation execute inside the route handler.
* Heavy tasks (e.g., Playwright screenshots) delegate to GitHub Actions runners.


4. **Persistence:** Structured logs and media assets are written directly to Sanity.
5. **Consumption:** Next.js App Router renders content and queries Sanity via GROQ.
6. **User Contact:** User contact medium is email implementing through Resend.

## 4. Environment Boundaries & Secrets

* `GITHUB_WEBHOOK_SECRET`: HMAC-SHA256 signature verification (server-only).
* `GEMINI_API_KEY`: AI inference for triage, generation, and chat (server-only).
* `SANITY_API_WRITE_TOKEN`: Mutation access for the autonomous agent (server-only).
* `NEXT_PUBLIC_SANITY_PROJECT_ID` & `NEXT_PUBLIC_SANITY_DATASET`: Client-safe configs.

## 5. Non-Negotiable Dev Constraints

* Never introduce persistent daemons, Redis workers, or 24/7 VPS services.
* Keep route handler execution within serverless limits (< 15 seconds).
* Reject any webhook request failing HMAC verification immediately with HTTP 401.
* All Sanity mutations must pass strict schema validation before submission.

```