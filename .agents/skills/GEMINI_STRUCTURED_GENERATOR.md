# Gemini Structured Generator & Autonomous DevLog Synthesis

> **Overview:** Procedural instructions for the Agentic Dev to configure the Google Gen AI SDK using Gemini 3.5-Flash (As Agentic Writer), preprocess git diffs, enforce strict JSON schemas for devlog entries, and handle API retries and token constraints.  
> **When to Use:** Consult when authoring the automated devlog generation pipeline, structuring system prompts for diff analysis, configuring structured outputs, or tuning LLM inference parameters.

---

## 2. Input Preprocessing & Audience-Aware Prompt Framing (for Agentic Writer)
- **Diff Hygiene & Truncation Strategy:**
  - Strip generated lockfiles (`package-lock.json`, `pnpm-lock.yaml`), compiled binaries, source maps, and auto-generated asset paths before assembling the prompt payload.
  - Enforce an upper character limit on the git diff. If a patch exceeds the budget, retain the complete file patch headers and commit message, then truncate individual hunk bodies with an explicit truncation annotation.
- **Multi-Audience Persona Framing:**
  - Instruct the model to write as an articulate, technically sharp developer documenting real engineering momentum.
  - **Most important prompt for Agentic Writer:** Tell the model: `You are NOT JUST an AI. You are my proxy. My otherselves. Write as if you are a Human technical writer.` (similar like that).
  - Calibrate the voice for a blended audience:
    - **Recruiters & Clients:** Keep the high-level summary readable, outcome-focused, and accessible without dense jargon roadblocks. Highlight practical value, business impact, and problem-solving capability.
    - **Engineers & Technical Leads:** Keep the bulleted highlights and affected modules technically precise, architectural, and grounded in concrete patterns.
    - **Personal Reference:** Maintain an authentic log of your build journey, decision-making, and progress.
  - Forbid hollow marketing buzzwords, empty hype, and repetitive conversational fluff ("In this commit..."), ensuring every sentence highlights genuine momentum backed by the diff.

---

## 3. Strict Schema Enforcement (`responseSchema`)
- **JSON Mode Directive:** Configure the request with `responseMimeType: "application/json"` and define a formal `response schema` at the SDK level to guarantee structural compliance.

---

## 4. Error Handling, Validation & Fallback Loops
- **Post-Generation Zod Validation:** Never write the raw JSON directly to the CMS. Pass the parsed response through an equivalent Zod schema on the server to validate field integrity, array lengths, and enum values.
- **Retry & Recovery:**
  - If the model returns malformed JSON or triggers a rate limit (HTTP 429), execute an exponential backoff retry loop capped at three attempts.
  - If schema validation fails after a retry, gracefully abort the automatic publishing step, log the raw generation payload to a diagnostic store, and flag the event for manual inspection rather than pushing corrupted data to Sanity.