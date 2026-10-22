# Generation Engine Specification

> **Overview:** Defines implementation guidelines for the AI generation pipeline, instructing agentic dev on how to ingest git diffs, prompt Gemini with strict structured outputs, synthesize architectural diagrams, and orchestrate media without hardcoding content schemas.  
> **When to Use:** Reference when building or refactoring `/lib/ai/`, prompt orchestration pipelines, diff-parsing utilities, or media extraction routines.

---

## 1. Input Processing & Diff Budgeting
- **Diff Ingestion:** Strip non-essential diff lines (e.g., lockfiles, binary assets, and whitespace-only edits) before feeding into the context window.
- **Token Budget Guardrails:** Truncate large single-commit diffs to a strict character limit (e.g., 20,000 characters). 
- **Summary Truncation Fallback:** If a diff exceeds the budget, generate an intermediate file-level change summary first, then feed the summarized changes to the generator.

## 2. Gemini Integration & Structured Output
- **SDK & Model:** Use the Google Gen AI SDK invoking `gemini-3.5-flash` for high-throughput, low-latency generation.
- **Output Enforcement:** Always utilize structured JSON mode (`responseSchema` or function calling). Do not rely on plain markdown text generation to populate database records.
- **Dynamic Field Contract:** Return generic payload structures (e.g., `title`, `summary`, `bodyMarkdown`, `mermaidDiagram` (for diagrams such as ERDs, flowcharts, and sequence diagrams), `discoveredMediaUrls`) so content schema changes do not break the engine.

## 3. Media & Diagram Generation Rules
- **Backend/CLI Commits:** If the commit affects primarily backend or non-UI files, instruct Gemini to generate a valid `mermaid` flowchart or sequence diagram depicting data flow changes.
- **Diagram Syntax Validation:** Run an AST or regex check on generated Mermaid syntax prior to persistence to prevent frontend render crashes.
- **Asset Discovery:** Parse git commit messages and PR bodies for image links, Loom URLs, or embedded video references, outputting them into an array of external media links.

## 4. Error Handling & Idempotency
- **Fallback Generation:** If JSON validation or syntax checking fails, retry once with temperature `0.0`. If it fails again, log the raw diff and exit cleanly without creating partial records.
- **Deterministic Keys:** Pass a deterministic generation key derived from `repository + commitSha` to ensure repeated webhook invocations yield predictable results.