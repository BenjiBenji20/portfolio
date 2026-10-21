# Agentic Dev: Architecture Index & Router

> **Overview:** Serves as the primary navigational index and architectural manifesto for the Agentic Dev. Defines directory maps, core technical constraints, and modular context-loading rules to prevent token bloat during development.  
> **When to Use:** Read this first before implementing, refactoring, or reviewing any service boundary in the Benjineer Portfolio repository.

---

## 1. Architecture Context Router
Load only the specification file relevant to your active development task:

| Target File | Scope & Implementation Domain | Associated Source Directories |
| :--- | :--- | :--- |
| `SYSTEM_TOPOLOGY_SPEC.md` | Monorepo layout, environment variables, security boundaries | `app/`, `sanity/`, project root |
| `WEBHOOK_INTAKE_SPEC.md` | HMAC signature validation, commit filters, triage gates | `app/api/webhooks/github/`, `lib/github/` |
| `GENERATION_ENGINE_SPEC.md` | Gemini API integration, diff parsing, Mermaid generation | `lib/ai/`, `lib/generators/` |
| `CMS_DATA_SPEC.md` | Sanity client setup, mutation safety, GROQ utilities | `sanity/lib/`, `sanity/schemas/` |
| `CHAT_RAG_POWERED_SPEC.md` | Visitor chat route, streaming patterns, context assembly | `app/api/chat/`, `components/chat/` |

## 2. Strict Operating Rules
- **No Schema Assumptions:** Never hardcode document structures. Follow user-defined schemas as specified in `CMS_DATA_SPEC.md`.
- **Context Isolation:** Load only one architecture specification at a time alongside this README to keep context windows focused and efficient.
- **Fail Early:** Validate all webhooks, diff sizes, and API tokens before initiating any third-party network requests.
