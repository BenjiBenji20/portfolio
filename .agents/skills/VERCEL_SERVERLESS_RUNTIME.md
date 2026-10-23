# Vercel Serverless Runtime, Hobby Tier Optimization & Function Consolidation

> **Overview:** Procedural instructions for the Agentic Dev to optimize serverless execution, stay strictly within Vercel's Hobby (Free) tier limits, multiplex endpoints into consolidated handlers, manage timeout budgets, and enforce environment variable hygiene.  
> **When to Use:** Consult when authoring or modifying `/app/api` route handlers, configuring `vercel.json`, architecting function dispatchers, tuning execution regions, or setting HTTP cache headers.

---

## 1. Hobby Tier Limits & Function Consolidation (The Unified Dispatcher Pattern)
- **Hobby Plan Constraints:**
  - Hard limit of 10 to 15 seconds per Serverless Function execution.
  - Strict monthly caps on overall serverless function invocations and compute duration (GB-hours).
  - Total deployed serverless function count limitations to prevent build rejections.
- **Route Multiplexing Directive:**
  - Avoid creating sprawling, single-purpose `/api/*` route files for every minor action.
  - Consolidate closely related operational workflows into unified, multi-action gateway handlers (e.g., combining contact dispatch, verification checks, and form validation under a single `/api/actions` or `/api/gateway` route, or grouping data ingestion tasks).
  - Implement an action-based routing strategy (e.g., using a discriminated request body field such as `action: "contact"` | `"verify"` or a clean dynamic sub-path) coupled with an internal dispatch map or exhaustive `switch` block.
  - Ensure shared utilities (input sanitization, reCAPTCHA validation, error wrappers) run uniformly at the gateway entry point before branching to sub-handlers, maximizing cold-start memory warmth and code reuse.

---

## 2. Execution Timeout Budgets & Payload Limits
- **The 10-Second Budget Enforcement:**
  - Every incoming request must resolve well within the 10-second ceiling to prevent Vercel Gateway 504 Gateway Timeout errors.
  - Measure round-trip latencies of external dependencies (Sanity client writes, Gemini generation, Google siteverify, Resend API) and allocate strict sub-budgets (e.g., reCAPTCHA: < 1s, Gemini: < 6s, Sanity: < 2s).
- **Graceful Timeout Degradation:**
  - If a generative task or upstream payload fetch nears the 8-second mark, abort the long-running operation gracefully using `AbortController` signals and return a clean HTTP 504 or fallback response rather than allowing the platform to forcefully terminate the runtime.
- **Payload & Body Size Caps:**
  - Enforce a strict request body size limit under 4.5MB (Vercel’s serverless payload ceiling). Reject oversized payloads immediately at the route boundary before processing.

---

## 3. Region Pinning, Cold Start Mitigation & Caching
- **Geographic Proximity Pinning:**
  - Pin the serverless function deployment region explicitly in `vercel.json` (or route segment configs) to match the closest geographical center to your primary database/CMS and traffic (e.g., `iad1` for US East or `sin1` for Southeast Asia).
  - Avoid deploying functions to regions geographically distant from Sanity’s primary endpoints to minimize cross-continental transit latency.
- **Cold Start Reduction:**
  - Keep bundle sizes lean: dynamically import heavy utility packages only inside the specific switch branch where they are executed.
  - Rely on native Web APIs (`fetch`, `crypto.subtle`, `ReadableStream`) rather than importing heavy Node.js polyfills or third-party wrappers.
- **Edge Cache Headers:**
  - For non-mutating data queries (such as public project metadata or feed previews), serve responses using `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` to offload traffic to the Vercel Edge Network and eliminate unnecessary serverless compute invocations.

---

## 4. Environment Variable Hierarchy & Deployment Hygiene
- **Strict Scope Separation:**
  - User still the one that manages the environment variables in Vercel dashboard.
  - Clearly delineate variables across **Production**, **Preview**, and **Development** in the Vercel Dashboard.
  - Ensure sensitive live API keys (Sanity Write Tokens, GitHub Webhook Secrets, Gemini Production Keys) are never shared with or exposed in untrusted branch previews.
- **Client vs. Server Boundary:**
  - Prefix variables with `NEXT_PUBLIC_` strictly when required by browser scripts (e.g., reCAPTCHA site key, Sanity project ID, public dataset name).
  - Treat all unprefixed environment variables as strictly confidential server-side secrets. Audit compiled client chunks during build verification to confirm zero secret leakage.
- **Build Fail-Fast Validation:**
  - Run a lightweight environment variable schema check (via Zod or an environment validator script) at build time to break failed deployments immediately if any mandatory runtime secret is missing.
  