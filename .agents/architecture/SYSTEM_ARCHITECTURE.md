## 1. Two-Stage Hybrid Monolith Architecture
The platform operates as a unified monolithic repository split across two distinct, zero-cost compute stages to balance instant web responsiveness with heavy, unconstrained background synthesis.

### Stage 1: Vercel Serverless Gatekeeper (Low-Latency Web & Intake Layer)
- **Runtime Environment:** Vercel Hobby Serverless & Edge network.
- **Execution Ceiling:** Strict 10-second timeout budget and 4.5MB payload limit per invocation.
- **Core Responsibilities:**
  - **Presentation & UI Rendering:** Serving the Next.js App Router frontend using Incremental Static Regeneration (ISR) and cached edge responses.
  - **Webhook Intake & Fast Triage (`/api/webhooks/github`):** Receiving outbound GitHub push and pull request events, performing cryptographic HMAC-SHA256 verification, applying deterministic Tier 1 file filtering, and immediately handing off valid events to Stage 2 via `workflow_dispatch` within 1.5 seconds.
  - **Unified Action Gateway (`/api/gateway`):** Multiplexing low-latency visitor actions, including Google reCAPTCHA v3 score verification and EmailJS contact dispatch.
  - **Conversational RAG Assistant (`/api/chat`):** Executing real-time GROQ context projections against Sanity Content Lake and streaming token responses from Gemini 3.5-flash-lite.
  - **On-Demand Cache Invalidation (`/api/webhook/sanity/revalidate`):** Listening for Sanity mutation webhooks to purge stale cache tags (`revalidateTag`) and regenerate static routes instantaneously.

### Stage 2: GitHub Actions Ephemeral Worker (Unconstrained Knowledge Layer)
- **Runtime Environment:** GitHub Actions ephemeral Ubuntu runners (2 vCPU, 7 GB RAM) living inside the same repository (`.github/workflows/` and `/scripts`).
- **Execution Ceiling:** Up to 6 hours per job (typically completing in 20–45 seconds), completely bypassing Vercel's serverless timeout and bundle size limits.
- **Core Responsibilities:**
  - **Remote Context Acquisition:** Fetching the target repository's `.portfolio.json` configuration contract, commit metadata, PR descriptions, and raw git diffs.
  - **Multi-Tier Semantic Triage:** Evaluating source churn (Tier 2) and querying Gemini 3.5-flash-lite (Tier 3) to score architectural significance and filter out trivial updates.
  - **Headless Media & Diagram Synthesis:** Executing headless browser instances for live viewport screenshot capture (`1280x800` desktop, `390x844` mobile), harvesting committed graphical assets, and generating validated Mermaid.js architecture diagrams.
  - **Content Lake Synchronization:** Streaming binary media assets and committing idempotent, structured Portable Text devlog documents directly to Sanity Content Lake via HTTP mutations.
