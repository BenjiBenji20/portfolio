import type { z } from 'zod';
import type { ValidatedPortfolioConfig, TriageResult, DevLogSynthesisResult, FileSummary } from '../types';
import type { GitHubContext, FileDelta } from './githubContextService';
import {
  TriageResponseSchema,
  DevLogSynthesisSchema,
  BatchFileSummarySchema,
  GEMINI_TRIAGE_RESPONSE_SCHEMA,
  GEMINI_DEVLOG_SYNTHESIS_SCHEMA,
  GEMINI_BATCH_FILE_SUMMARY_SCHEMA,
  extractZodDiagnostics,
} from '../parsers/aiResponseParser';
import { geminiQuotaGuardrail } from '../utils/geminiQuotaGuardrail';
import { SANITY_SCHEMA_CONTEXT_PROMPT, VALID_BADGES } from '../utils/schemaContext';

/**
 * Service to execute Gemini 3-Stage Map-Reduce Pipeline with strict SDK-level responseSchema,
 * sliding-window rate limit guardrails, and knowledge-retaining batch distillation:
 * - Stage 1: Lightweight Triage Gate (diffStat + commit/PR metadata)
 * - Stage 2: Size-Aware Batch Distillation (Adaptive batching + knowledge accumulator)
 * - Stage 3: Cross-Referenced Holistic Synthesis (Reduce Stage: correlate modules into devlog + Mermaid)
 */

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-3-pro-preview'];

async function callGemini(
  prompt: string,
  systemInstruction?: string,
  temperature = 0.2,
  responseSchema?: Record<string, unknown>,
  taskName = 'GeminiCall',
  modelName = PRIMARY_MODEL
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('[GeminiService] Missing GEMINI_API_KEY environment variable.');
  }

  // Enforce sliding-window rate limit guardrail before dispatching request
  await geminiQuotaGuardrail.waitForAvailableSlot(taskName);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const bodyPayload: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature,
      ...(responseSchema ? { responseSchema } : {}),
    },
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      role: 'system',
      parts: [{ text: systemInstruction }],
    };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(60000), // 60s timeout for heavy diff synthesis
    });
  } catch (fetchErr) {
    // Network timeout or connection drop: rollback slot
    geminiQuotaGuardrail.rollbackSlot();
    throw fetchErr;
  }

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 429) {
      await geminiQuotaGuardrail.handleRateLimitResponse(errorText);
    } else if (res.status === 503) {
      // Server-side congestion: rollback sliding-window quota timestamp
      geminiQuotaGuardrail.rollbackSlot();
    }
    throw new Error(`[GeminiService] Gemini API returned HTTP ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`[GeminiService] Empty response from Gemini API: ${JSON.stringify(json)}`);
  }

  return text;
}

/**
 * Self-Healing Execution Engine
 * 
 * Executes an LLM prompt and validates the output against a Zod schema.
 * If validation fails, it enters a self-healing loop:
 * 1. Extracts the exact field-level diagnostic report from Zod.
 * 2. Drops temperature to 0.0 for deterministic error correction.
 * 3. Feeds the diagnostic report and the malformed output back to Gemini.
 * 4. Repeats up to maxRetries (default: 3) before escalating.
 */
async function executeWithSelfHealing<T>(
  taskName: string,
  initialPrompt: string,
  systemInstruction: string,
  zodSchema: z.ZodType<T>,
  geminiSchema: Record<string, unknown>,
  maxRetries = 4
): Promise<T> {
  let currentPrompt = initialPrompt;
  let temperature = 0.2;
  let lastRawOutput = '';
  let lastErrorReport = '';
  let activeModel = PRIMARY_MODEL;
  let fallbackIndex = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isRetry = attempt > 1;
    if (isRetry) {
      console.warn(
        `[GeminiService] [${taskName}] Retry Attempt ${attempt}/${maxRetries} (Model: ${activeModel}, Temp: ${temperature})...`
      );
    }

    try {
      const rawOutput = await callGemini(
        currentPrompt,
        systemInstruction,
        temperature,
        geminiSchema,
        taskName,
        activeModel
      );
      lastRawOutput = rawOutput;

      const diagnostics = extractZodDiagnostics(rawOutput, zodSchema);

      if (diagnostics.valid && diagnostics.data) {
        if (isRetry) {
          console.log(`[GeminiService] [${taskName}] Successful on attempt ${attempt} using ${activeModel}! Schema fully satisfied.`);
        }
        return diagnostics.data;
      }

      // Record diagnostics for next self-healing turn
      lastErrorReport = diagnostics.errorReport || 'Unknown schema validation error';
      console.warn(
        `[GeminiService] [${taskName}] Validation failed on attempt ${attempt}:\n${lastErrorReport}`
      );

      // Formulate targeted correction prompt for next attempt (Temperature 0.0)
      temperature = 0.0;
      currentPrompt = `
Your previous response failed strict schema validation and violated required constraints.

DIAGNOSTIC ERROR REPORT:
${lastErrorReport}

MALFORMED RESPONSE RECEIVED:
\`\`\`json
${lastRawOutput}
\`\`\`

CORRECTION INSTRUCTIONS:
- Examine each failing field listed in the diagnostic report above.
- Fix all constraint violations (e.g. required string lengths, array minimum item counts, or missing properties).
- If "mermaidDiagram" is present, ensure all node labels are wrapped in double quotes inside brackets (e.g. NodeA["Step Name"]).
- Return ONLY the corrected, valid JSON conforming exactly to the required schema. Do not include markdown code block backticks inside property values.
`;
    } catch (networkOrApiError) {
      const errString = String(networkOrApiError);
      const is503HighDemand =
        errString.includes('503') ||
        errString.includes('UNAVAILABLE') ||
        errString.includes('high demand');

      console.error(
        `[GeminiService] [${taskName}] API call failed on attempt ${attempt} (${activeModel}):`,
        networkOrApiError
      );

      if (attempt === maxRetries) {
        throw networkOrApiError;
      }

      const isDailyQuotaExhausted = errString.includes('DAILY_QUOTA_EXHAUSTED');

      if (isDailyQuotaExhausted || is503HighDemand) {
        // If daily quota exhausted or high demand, failover to the next available fallback model
        if (fallbackIndex < FALLBACK_MODELS.length) {
          const nextModel = FALLBACK_MODELS[fallbackIndex++];
          console.warn(
            `[GeminiService] [${taskName}] ⚡ ${isDailyQuotaExhausted ? 'Daily quota exhausted' : 'High demand detected'} on '${activeModel}'. Failing over immediately to: '${nextModel}'`
          );
          activeModel = nextModel;
        }

        if (isDailyQuotaExhausted) {
          // Immediate retry with the next model (no backoff needed since switching to fresh quota pool)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        // Jittered backoff delay for 503 server congestion
        const baseDelayMs = attempt === 1 ? 6000 : attempt * 8000;
        const jitterMs = Math.floor(Math.random() * 2500);
        const backoffMs = baseDelayMs + jitterMs;
        console.warn(
          `[GeminiService] [${taskName}] Waiting ${(backoffMs / 1000).toFixed(1)}s (jittered backoff) before retry...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        // Standard exponential backoff delay for other transient errors
        const backoffMs = attempt * 2500;
        console.warn(`[GeminiService] [${taskName}] Waiting ${backoffMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `[GeminiService] [${taskName}] Self-healing failed after ${maxRetries} attempts. Last diagnostics:\n${lastErrorReport}\nLast output:\n${lastRawOutput}`
  );
}

/**
 * Stage 1: Lightweight Editorial Triage Gate
 * Analyzes git diff --stat + commit/PR metadata with minimal token overhead (< 1.5s execution)
 */
export async function evaluateEditorialTriage(
  prTitle: string,
  gitContext: GitHubContext,
  config: ValidatedPortfolioConfig
): Promise<TriageResult> {
  console.log('[GeminiService] Running Stage 1: Lightweight Editorial Triage Gate (Stat-enforced)...');

  const prompt = `
Evaluate the engineering significance of this commit/PR for project "${config.projectTitle}".

METADATA & SCOPE:
- PR / Commit Title: ${prTitle}
- PR Description: ${gitContext.prBody || 'None provided'}
- Primary Commit Message: ${gitContext.commitMessage || 'None provided'}
- Changed File Count: ${gitContext.changedFiles.length}

DIFF STAT OVERVIEW:
\`\`\`text
${gitContext.diffStat || gitContext.changedFiles.map((f) => `- ${f}`).join('\n')}
\`\`\`

TRIAGE EVALUATION RULES:
- Score 1-4 (REJECT): Routine dependency updates, formatting/linting fixes, minor typo edits, or empty scaffolding.
- Score 5-6 (BORDERLINE): Minor refactors or simple single-line bug fixes without architectural impact.
- Score 7-10 (APPROVE): Significant feature additions, new CLI apps, architectural state changes, security hardening, or optimization.
- Return valid JSON matching schema.
`;

  const systemInstruction = `You are a strict technical lead and editorial gatekeeper. Score rigorously based on real engineering momentum. Do not hallucinate or award high scores to routine housekeeping.`;

  try {
    const validated = await executeWithSelfHealing(
      'EditorialTriage',
      prompt,
      systemInstruction,
      TriageResponseSchema,
      GEMINI_TRIAGE_RESPONSE_SCHEMA,
      4
    );

    return {
      publishable: validated.publishable,
      score: validated.score,
      rationale: validated.rationale,
      suggestedBadge: validated.suggestedBadge,
    };
  } catch (err) {
    console.warn('[GeminiService] Triage prompt failed after self-healing attempts. Error details:', err);
    return {
      publishable: true,
      score: 7,
      rationale: 'Fallback approval due to schema verification error after self-healing',
      suggestedBadge: 'Engineering',
    };
  }
}

/**
 * Groups file deltas into size-aware batches based on line and character budgets.
 * - 10 small files (500 lines total) -> 1 batch.
 * - 10 large files (8,000 lines total) -> dynamically partitioned into 4-5 batches.
 */
function groupFileDeltasIntoSizeBatches(
  deltas: FileDelta[],
  maxCharsPerBatch = 15000,
  maxLinesPerBatch = 1500
): FileDelta[][] {
  const batches: FileDelta[][] = [];
  let currentBatch: FileDelta[] = [];
  let currentChars = 0;
  let currentLines = 0;

  for (const delta of deltas) {
    const patchLength = delta.patch ? delta.patch.length : 0;
    const lineCount = (delta.additions || 0) + (delta.deletions || 0);

    if (
      currentBatch.length > 0 &&
      (currentChars + patchLength > maxCharsPerBatch || currentLines + lineCount > maxLinesPerBatch)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
      currentLines = 0;
    }

    currentBatch.push(delta);
    currentChars += patchLength;
    currentLines += lineCount;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/**
 * Stage 2: Size-Aware Batch Semantic Distillation (Map Stage)
 * Packs files dynamically by line/char budget and retains accumulated context across batches
 */
export async function distillFileSummaries(
  fileDeltas: FileDelta[],
  config: ValidatedPortfolioConfig
): Promise<FileSummary[]> {
  const actionableDeltas = fileDeltas.filter((d) => d.patch && d.patch.trim().length > 0);
  if (actionableDeltas.length === 0) return [];

  const batches = groupFileDeltasIntoSizeBatches(actionableDeltas, 15000, 1500);
  console.log(
    `[GeminiService] Running Stage 2: Size-Aware Batch Distillation on ${actionableDeltas.length} functional file(s) across ${batches.length} batch(es)...`
  );

  const accumulatedSummaries: FileSummary[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `[GeminiService] Distilling Batch ${i + 1}/${batches.length} (${batch.length} file(s): ${batch.map((f) => f.filename).join(', ')})...`
    );

    // Knowledge retention: Inject prior batch summaries as context
    const priorKnowledgeContext = accumulatedSummaries.length > 0
      ? `\nPREVIOUSLY ANALYZED MODULES IN THIS PR (Retain this context):\n` +
      accumulatedSummaries
        .map((s) => `- ${s.filename}: ${s.responsibility} (Deltas: ${s.keyChanges.join(', ')})`)
        .join('\n') +
      `\n`
      : '';

    const filesContent = batch
      .map(
        (f) => `### File: ${f.filename} [${f.status}] (+${f.additions}, -${f.deletions})
\`\`\`diff
${f.patch?.slice(0, 6000) || 'No patch available'}
\`\`\``
      )
      .join('\n\n');

    const prompt = `
Analyze the following code patches for project "${config.projectTitle}".
${priorKnowledgeContext}
CURRENT BATCH TO ANALYZE (${batch.length} files):
${filesContent}

DISTILLATION REQUIREMENTS:
- For EACH file in this batch, distill its core functional responsibility in 1-2 dense, factual sentences.
- List key functions, interfaces, routes, or algorithms added or modified.
- Note any architectural impact (e.g. database schema changes, external API calls, caching, session state).
- FORBIDDEN: Fluff or vague filler ("This file is an important part of the app").
- Return a JSON object with a "files" array matching the schema.
`;

    const systemInstruction = `You are an expert compiler and systems engineer analyzing code deltas. Extract exact technical facts, function signatures, and state mutations only. Retain prior context.`;

    try {
      const batchResult = await executeWithSelfHealing(
        `BatchDistill-${i + 1}`,
        prompt,
        systemInstruction,
        BatchFileSummarySchema,
        GEMINI_BATCH_FILE_SUMMARY_SCHEMA,
        3
      );

      for (const item of batchResult.files) {
        accumulatedSummaries.push({
          filename: item.filename,
          responsibility: item.responsibility,
          keyChanges: item.keyChanges,
          architecturalImpact: item.architecturalImpact,
        });
      }
    } catch (err) {
      console.warn(`[GeminiService] Batch ${i + 1} failed, using fallbacks:`, err);
      for (const delta of batch) {
        accumulatedSummaries.push({
          filename: delta.filename,
          responsibility: `Modified ${delta.filename} (${delta.status}: +${delta.additions}, -${delta.deletions})`,
          keyChanges: [`Updates to ${delta.filename}`],
          architecturalImpact: 'None',
        });
      }
    }
  }

  return accumulatedSummaries;
}

/**
 * Stage 3: Cross-Referenced Holistic Synthesis (Reduce Stage)
 * Weaves distilled per-file facts into an integrated engineering DevLog + deterministic Mermaid diagram
 */
export async function synthesizeDevLog(
  prTitle: string,
  gitContext: GitHubContext,
  config: ValidatedPortfolioConfig,
  triage: TriageResult,
  fileSummaries: FileSummary[] = []
): Promise<DevLogSynthesisResult> {
  console.log('[GeminiService] Running Stage 3: Cross-Referenced Narrative Synthesis & Mermaid Diagram...');

  const generateDiagram = config.mediaPreferences?.generateArchitectureDiagrams !== false;

  // Collect all author directives and dynamic custom keys from .portfolio.json
  const standardConfigKeys = new Set([
    'track',
    'schema',
    '$schema',
    'requireHumanApproval',
    'note',
    'ignoreDirectory',
    'projectTitle',
    'projectSlug',
    'category',
    'liveUrl',
    'primaryBranch',
    'mediaPreferences',
  ]);

  const dynamicDirectives: string[] = [];
  if (config.note) {
    dynamicDirectives.push(`- Project Note: "${config.note}"`);
  }
  for (const [key, value] of Object.entries(config)) {
    if (!standardConfigKeys.has(key) && value !== undefined && value !== null) {
      const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
      dynamicDirectives.push(`- Dynamic Directive [${key}]: "${displayVal}"`);
    }
  }

  const dynamicDirectivesBlock = dynamicDirectives.length > 0
    ? `CRITICAL AUTHOR DIRECTIVES (.portfolio.json):\n${dynamicDirectives.join('\n')}\n(IMPORTANT: If "userMessage" or custom guidance is provided above, you MUST strictly follow it over default notes.)`
    : '';

  const mermaidInstructions = generateDiagram
    ? `
MERMAID ARCHITECTURAL DIAGRAM INSTRUCTIONS:
- Allowed diagram types: ONLY "flowchart TD" (or "flowchart LR") or "sequenceDiagram". Forbid experimental types.
- Node Labels MUST ALWAYS be wrapped in double quotes inside shape delimiters:
  * Standard processing step: NodeA["Step Name"]
  * Database / persistent storage: DB[("Database or Lake")]
  * Terminal / Client: Client("Web Browser / Client")
  * Decision / Condition: Check{"Condition?"}
- Edge labels MUST use clean pipe notation with plain words: A -->|HTTPS GET| B or A -.->|Async Event| B
- CRITICAL EDGE LABEL RULE: NEVER place quotes (" or ') or parentheses ( or ) inside edge labels. For example, write A -->|Run Audit Command -b| B, NEVER A -->|Run Audit Command("-b")| B.
- NEVER use Unicode arrow characters (e.g. "→"). Always use valid ASCII connectors: "-->", "-.->", "==>".
- Node labels MUST NOT use "::" (use single colon ":" instead to prevent Mermaid class operator conflicts).
- NEVER include inline CSS styles, colors, classDef, or style attributes.
- Return raw diagram string with newlines. Do NOT enclose in markdown backticks (\`\`\`mermaid) inside JSON value.

Literal Flowchart Example:
flowchart TD
  Client("Web Browser") -->|HTTPS GET| AppServer["Next.js App Server"]
  AppServer -->|Sanity Client CDN| Lake[("Sanity Content Lake")]
  Lake -.->|Webhook Invalidation| AppServer

Literal Sequence Diagram Example:
sequenceDiagram
  autonumber
  actor Dev as Developer
  participant Studio as Sanity Studio
  participant CDN as Sanity Lake
  participant Web as Next.js Site
  Dev->>Studio: Publish Document
  Studio->>CDN: Ingest Mutation
  CDN-->>Web: Webhook Event
  Web->>Web: Revalidate Cache Tag
`
    : 'Do not generate a mermaid diagram (set mermaidDiagram to null).';

  const summariesBlock = fileSummaries.length > 0
    ? fileSummaries
      .map(
        (s) => `### File: ${s.filename}
- Responsibility: ${s.responsibility}
- Key Deltas: ${s.keyChanges.join('; ')}
- Architectural Impact: ${s.architecturalImpact || 'None'}`
      )
      .join('\n\n')
    : `Changed Files: ${gitContext.changedFiles.join(', ')}\nRaw Diff Excerpt:\n${gitContext.rawDiff.slice(0, 10000)}`;

  const prompt = `
Synthesize a structured engineering DevLog entry for project "${config.projectTitle}" (slug: "${config.projectSlug}").

CHANGE CONTEXT:
- PR / Commit Title: ${prTitle}
- Suggested Badge: ${triage.suggestedBadge || 'Feature'}
- PR Description: ${gitContext.prBody || 'None provided'}
- Commit Message: ${gitContext.commitMessage}
${dynamicDirectivesBlock}

DISTILLED FILE MODULES & CROSS-REFERENCES:
${summariesBlock}

SYNTHESIS REQUIREMENTS:
1. Title: Concise, outcome-oriented engineering title without commit hashes.
2. Badge: MUST BE EXACTLY ONE OF: [${VALID_BADGES.map((b) => `"${b}"`).join(', ')}].
3. Description: 2-3 sentence overview highlighting practical value, problem solved, and technical approach. Connect how the modules interact.
4. Highlights: 3-4 bullet points detailing concrete patterns, affected systems, or performance improvements.
5. Affected Subsystems: Array of short system names (e.g. ["Ingestion Pipeline", "Redis Cache", "CLI Framework"]).
6. Parent Project Grounding:
   - projectOverview: A comprehensive, professional technical description explaining the core architecture, purpose, and problem solved by project "${config.projectTitle}". (Do NOT truncate or constrain to 280 characters; this is used for the project body narrative. Strictly prioritize any userMessage directive).
   - techStacks: Array of 2-5 relevant tools, libraries, or frameworks used (e.g. ["Python", "Requests", "CLI"]).
${mermaidInstructions}
`;

  const systemInstruction = `
You are my proxy — a Senior Technical Writer and Software Architect. Write as an authentic human engineer documenting real production momentum.

${SANITY_SCHEMA_CONTEXT_PROMPT}

STRICT VOICE & VOCABULARY INVARIANTS:
- FORBIDDEN AI BUZZWORDS: Never use "In this modern landscape", "Delve into", "Pivotal", "Testament to", "Beacon", "A game-changer", "Revolutionary", "Let's explore", "In today's fast-paced world", "Exciting new feature".
- GROUNDING: Cite concrete filenames, architectural patterns (e.g. "HMAC-SHA256 handshake", "Zod safeParse", "sliding-window rate limiter"), and measurable outcomes.
- ZERO FABRICATION: Do not invent dependencies or link random external images.
- Follow the required JSON schema strictly.
${dynamicDirectivesBlock}
`;

  const validated = await executeWithSelfHealing(
    'DevLogSynthesis',
    prompt,
    systemInstruction,
    DevLogSynthesisSchema,
    GEMINI_DEVLOG_SYNTHESIS_SCHEMA,
    4
  );

  return {
    title: validated.title,
    badge: validated.badge,
    description: validated.description,
    highlights: validated.highlights,
    affectedSubsystems: validated.affectedSubsystems,
    mermaidDiagram: validated.mermaidDiagram || undefined,
    projectOverview: validated.projectOverview,
    techStacks: validated.techStacks,
  };
}
