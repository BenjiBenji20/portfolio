# Skills Index Routing

> **Overview:** Central navigation index for the Agentic Dev mapping technical workflows to specialized, procedural playbooks inside `.agents/skills/`.  
> **When to Use:** Consult this matrix before implementing third-party integrations, CMS queries/mutations, AI generation pipelines, or deployment optimizations.

---

## 1. Skills Routing Matrix

| Target File | Scope & Technical Domain |
| :--- | :--- |
| `GITHUB_WEBHOOK_HANDLER.md` | Web Crypto HMAC-SHA256 signature verification, GitHub `push`/`release` payload extraction, branch filtering, and fast-ack response budgets. |
| `RECAPTCHA_VERIFICATION.md` | Google reCAPTCHA v3 client execution, server-side `siteverify` checks, risk score thresholds, and defense across chat and contact routes. |
| `GEMINI_STRUCTURED_GENERATOR.md` | Gemini 3.5-Flash integration via Google Gen AI SDK, diff pre-processing, balanced temperature settings, and strict `responseSchema` JSON synthesis. |
| `STREAMING_CHAT_RAG.md` | Conversational portfolio assistant, real-time GROQ grounding projections, citation deep linking, and low-latency token streaming handlers. |
| `MERMAID_SYNTAX_VALIDATOR.md` | Generation prompts for top-down flowcharts and sequence diagrams, server-side syntax sanitization, and client-side safe SVG rendering with error fallbacks. |
| `SANITY_GROQ_MUTATIONS.md` | Parameterized GROQ queries, descending `priority` field ordering, `useCdn: false` real-time ingestion, on-demand Next.js cache revalidation, and idempotent patches. |
| `EMAILJS_DISPATCHER.md` | Contact form submission via EmailJS, input validation with Zod, bot score verification, environment variable isolation, and interactive submission feedback states. |
| `VERCEL_SERVERLESS_RUNTIME.md` | Vercel Hobby tier limits (10s timeouts), consolidated unified action gateway (`/api/gateway`), region pinning, cold start reduction, and cache headers. |

---

## 2. Playbook Selection Rules for Agentic Dev
- **Ingestion & Intake:** Load `GITHUB_WEBHOOK_HANDLER.md` and `RECAPTCHA_VERIFICATION.md` when wiring external incoming requests or user form submissions.
- **AI Synthesis & Diagramming:** Load `GEMINI_STRUCTURED_GENERATOR.md` and `MERMAID_SYNTAX_VALIDATOR.md` when building devlog generation tasks, prompt templates, or diagram components.
- **Interactive Assistant:** Load `STREAMING_CHAT_RAG.md` when building the chat drawer, prompt grounding, or streaming token endpoints.
- **Data Layer & CMS:** Load `SANITY_GROQ_MUTATIONS.md` whenever querying data, mutating records, or configuring cache tags in Next.js.
- **Outbound Messaging:** Load `EMAILJS_DISPATCHER.md` when constructing the contact section, handling email triggers, or verifying contact form payloads.
- **Serverless & Performance:** Load `VERCEL_SERVERLESS_RUNTIME.md` before adding new API routes to ensure functions remain consolidated and well within Hobby tier constraints.