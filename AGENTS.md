<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Benjineer Portfolio - Agentic Blog Site

This document is the root entrypoint and navigation index for AI agents working in the Benjineer Portfolio site. Follow the routing table below to dynamically load specialized domain knowledge on-demand to maintain high accuracy and prevent context saturation.

---

## 1. Always-On Invariant Rules (`.agents/rules/`)

The rules in `.agents/rules/` are **unconditionally active** across all development activities:

---

## 2. Task-to-Document Routing Matrix

Before writing, analyzing, or refactoring code in any specific domain, **read the corresponding document first**:

---

## 3. Knowledge Directory Structure

All prompt documents are partitioned by domain under `.agents/`. Each directory uses an internal `README.md` as its index router to prevent context bloat:

| Directory | Scope & Specification | Navigation Index |
| :--- | :--- | :--- |
| `.agents/persona/` | Agent identity (`Agentic Dev` vs `Agentic Writer`) and core behavioral directives | [persona/README.md](.agents/persona/README.md) |
| `.agents/architecture/` | System topology, CMS contracts, webhook intake, chat RAG, and generation engine | [architecture/README.md](.agents/architecture/README.md) |
| `.agents/rules/` | Invariant execution rules, git read-only safety, and artifact-first planning | [rules/WORKFLOW_RULES.md](.agents/rules/WORKFLOW_RULES.md) |
| `.agents/workflow/` | Branching lifecycle, PR procedures, and documentation sync requirements | [workflow/README.md](.agents/workflow/README.md) |
| `.agents/code_quality/` | Linting invariants, strict typing standards, test verification gates and code reusability standards | [code_quality/README.md](.agents/code_quality/README.md) |
| `.agents/ui_ux/` | Design tokens, navigation flows, interaction states, media presentation, and accessibility/performance | [ui_ux/README.md](.agents/ui_ux/README.md) |

---

## 4. Agent Operational Loop

1. **Identify**: Determine the domain and technical scope of the user request.
2. **Consult**: Read the relevant `.agents/` document(s) from the routing matrix above.
3. **Plan & Confirm**: Produce an artifact implementation plan if architectural changes are required.
4. **Execute**: Implement upon explicit approval adhering strictly to the documented domain patterns and invariants.

---

## 5. Dynamic Extension Protocol

When adding new prompts or skills to this repository:
1. Place the document in the appropriate `.agents/<category>/` directory.
2. Register a single-line entry in the **Task-to-Document Routing Matrix** above with the file path and core invariant.
3. Keep all individual prompt files focused, technical, and under their respective line limits.

---