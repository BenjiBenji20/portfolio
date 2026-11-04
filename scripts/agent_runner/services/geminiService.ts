import type { z } from 'zod';
import type { ValidatedPortfolioConfig, TriageResult, DevLogSynthesisResult } from '../types';
import type { GitHubContext } from './githubContextService';
import {
  TriageResponseSchema,
  DevLogSynthesisSchema,
  GEMINI_TRIAGE_RESPONSE_SCHEMA,
  GEMINI_DEVLOG_SYNTHESIS_SCHEMA,
  extractZodDiagnostics,
} from '../parsers/aiResponseParser';

/**
 * Service to execute Gemini 3.5-Flash prompts with strict SDK-level responseSchema,
 * runtime Zod verification, and an iterative self-healing correction loop:
 * 1. Tier 3 Editorial Triage Prompt (Enforced via TriageResponseSchema)
 * 2. DevLog Narrative Synthesis Prompt (Enforced via DevLogSynthesisSchema)
 * 3. Architectural Mermaid Diagram Prompt (Deterministic Syntax Contract)
 * 4. Schema Recovery & Self-Healing Loop (Temperature 0.0 + targeted diagnostic error feedback)
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

async function callGemini(
  prompt: string,
  systemInstruction?: string,
  temperature = 0.2,
  responseSchema?: Record<string, unknown>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('[GeminiService] Missing GEMINI_API_KEY environment variable.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

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

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload),
    signal: AbortSignal.timeout(60000), // 60s timeout for heavy diff synthesis
  });

  if (!res.ok) {
    const errorText = await res.text();
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
  maxRetries = 3
): Promise<T> {
  let currentPrompt = initialPrompt;
  let temperature = 0.2;
  let lastRawOutput = '';
  let lastErrorReport = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isRetry = attempt > 1;
    if (isRetry) {
      console.warn(
        `[GeminiService] [${taskName}] Self-Healing Attempt ${attempt}/${maxRetries} (Temp: 0.0). Feeding diagnostics back to model...`
      );
    }

    try {
      const rawOutput = await callGemini(
        currentPrompt,
        systemInstruction,
        temperature,
        geminiSchema
      );
      lastRawOutput = rawOutput;

      const diagnostics = extractZodDiagnostics(rawOutput, zodSchema);

      if (diagnostics.valid && diagnostics.data) {
        if (isRetry) {
          console.log(`[GeminiService] [${taskName}] Self-healing successful on attempt ${attempt}! Schema fully satisfied.`);
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
1. Examine each failing field listed in the diagnostic report above.
2. Fix all constraint violations (e.g. required string lengths, array minimum item counts, or missing properties).
3. If "mermaidDiagram" is present, ensure all node labels are wrapped in double quotes inside brackets (e.g. NodeA["Step Name"]).
4. Return ONLY the corrected, valid JSON conforming exactly to the required schema. Do not include markdown code block backticks inside property values.
`;
    } catch (networkOrApiError) {
      console.error(
        `[GeminiService] [${taskName}] API call failed on attempt ${attempt}:`,
        networkOrApiError
      );
      if (attempt === maxRetries) {
        throw networkOrApiError;
      }
      // Exponential backoff delay (2.5s, 5s) to gracefully absorb transient 503 high-demand spikes
      const backoffMs = attempt * 2500;
      console.warn(`[GeminiService] [${taskName}] Waiting ${backoffMs}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error(
    `[GeminiService] [${taskName}] Self-healing failed after ${maxRetries} attempts. Last diagnostics:\n${lastErrorReport}\nLast output:\n${lastRawOutput}`
  );
}

/**
 * Prompt 1: Tier 3 Editorial Triage
 * Constrained by GEMINI_TRIAGE_RESPONSE_SCHEMA and strictly validated by TriageResponseSchema (Zod)
 * with self-healing fallback.
 */
export async function evaluateEditorialTriage(
  prTitle: string,
  gitContext: GitHubContext,
  config: ValidatedPortfolioConfig
): Promise<TriageResult> {
  console.log('[GeminiService] Running Prompt 1: Tier 3 Editorial Triage (Zod-enforced)...');

  const prompt = `
Analyze the following pull request / commit changes for project "${config.projectTitle}".
Evaluate whether this change represents genuine engineering momentum, architectural improvement, feature release, performance optimization, or security hardening worthy of documenting on the developer's public portfolio devlog.

PR / Commit Title: ${prTitle}
PR Description: ${gitContext.prBody || 'None provided'}
Commit Message: ${gitContext.commitMessage || 'None provided'}
Changed Files: ${gitContext.changedFiles.join(', ')}

Git Diff Sample:
\`\`\`diff
${gitContext.rawDiff.slice(0, 10000)}
\`\`\`
`;

  const systemInstruction = `You are a strict technical lead and editorial gatekeeper evaluating software engineering progress. Score rigorously: routine dependency bumps or minor text tweaks score below 5; novel algorithms, state machines, API routes, or architectural additions score 7 or higher. Follow the required schema strictly.`;

  try {
    const validated = await executeWithSelfHealing(
      'EditorialTriage',
      prompt,
      systemInstruction,
      TriageResponseSchema,
      GEMINI_TRIAGE_RESPONSE_SCHEMA,
      3
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
 * Prompt 2 & 3: DevLog Narrative Synthesis & Deterministic Mermaid Diagram
 * Constrained by GEMINI_DEVLOG_SYNTHESIS_SCHEMA and strictly validated by DevLogSynthesisSchema (Zod)
 * with multi-attempt self-healing retry loop.
 */
export async function synthesizeDevLog(
  prTitle: string,
  gitContext: GitHubContext,
  config: ValidatedPortfolioConfig,
  triage: TriageResult
): Promise<DevLogSynthesisResult> {
  console.log('[GeminiService] Running Prompt 2 & 3: DevLog Narrative Synthesis & Deterministic Mermaid Diagram (Zod-enforced)...');

  const generateDiagram = config.mediaPreferences?.generateArchitectureDiagrams !== false;
  const authorNote = config.note ? `CRITICAL AUTHOR NOTE FOR THIS PROJECT: "${config.note}"` : '';

  const mermaidInstructions = generateDiagram
    ? `
Mermaid Diagram Instructions:
Generate a clean, deterministic architectural diagram representing the data flow, component interactions, or state transitions introduced in this code change.
STRICT SYNTAX CONTRACT (from MERMAID_SYNTAX_VALIDATOR & documentation/mermaid_diagram_syntax_guide.md):
- Allowed diagram types: ONLY "flowchart TD" (or "flowchart LR") or "sequenceDiagram". Forbid experimental types.
- Node Labels MUST ALWAYS be wrapped in double quotes inside shape delimiters:
  * Standard processing step: NodeA["Step Name"]
  * Database / persistent storage: DB[("Database or Lake")]
  * Terminal / Client: Client("Web Browser / Client")
  * Decision / Condition: Check{"Condition?"}
- Edge labels MUST use pipe notation: A -->|"HTTPS GET"| B or A -.->|"Async Event"| B
- NEVER include inline CSS styles, colors, classDef, or style attributes.
- Return raw diagram string with newlines. Do NOT enclose in markdown backticks (\`\`\`mermaid) inside the JSON value.

Example Flowchart format:
flowchart TD
  Client["Web Browser"] -->|"HTTPS POST /api"| Gateway["API Gateway"]
  Gateway -->|"Validate Session"| Check{"Authorized?"}
  Check -->|"Yes"| Worker["Task Worker"]
  Check -->|"No"| Deny["401 Unauthorized"]
  Worker -->|"Store Vectors"| DB[("Qdrant / Postgres")]
  DB -.->|"Stream Response"| Client

Example Sequence format:
sequenceDiagram
  autonumber
  actor User as Developer
  participant Studio as Sanity Studio
  participant Lake as Content Lake
  participant Web as Next.js Site
  User->>Studio: Publish Document
  Studio->>Lake: Ingest Mutation
  Lake-->>Web: Webhook Event
  Web->>Web: Revalidate Cache Tag
`
    : 'Do not generate a mermaid diagram (set mermaidDiagram to null).';

  const prompt = `
Generate a structured engineering devlog entry documenting the following changes for project "${config.projectTitle}".

PR / Commit Title: ${prTitle}
Suggested Badge: ${triage.suggestedBadge || 'Engineering'}
PR Description: ${gitContext.prBody || 'None provided'}
Commit Message: ${gitContext.commitMessage}
Changed Files: ${gitContext.changedFiles.join(', ')}
${authorNote}

Git Diff:
\`\`\`diff
${gitContext.rawDiff}
\`\`\`

Requirements:
1. Title: Concise, outcome-oriented engineering title (do NOT repeat commit hashes).
2. Badge: Single uppercase or capitalized badge (e.g. "Architecture", "Security", "Backend", "AI Pipeline", "Optimization").
3. Description: 2-3 sentence overview highlighting practical value, problem solved, and technical approach.
4. Highlights: 3-4 bullet points detailing concrete patterns, affected systems, or performance improvements.
5. Affected Subsystems: Array of short system names (e.g. ["Ingestion Pipeline", "Qdrant Vector Store", "Next.js Cache"]).
${mermaidInstructions}
`;

  const systemInstruction = `
You are NOT JUST an AI. You are my proxy. My other self. Write as if you are a Human technical writer documenting real engineering momentum.
Calibrate your voice for a blended audience:
- Recruiters & Clients: Keep the summary readable, outcome-focused, and accessible without dense jargon roadblocks.
- Engineers & Technical Leads: Keep highlights technically precise, architectural, and grounded in concrete patterns.
- Personal Reference: Maintain an authentic log of your build journey.
Forbid hollow marketing buzzwords, empty hype, and repetitive conversational fluff ("In this commit...").
Follow the required JSON schema strictly.
${authorNote}
`;

  const validated = await executeWithSelfHealing(
    'DevLogSynthesis',
    prompt,
    systemInstruction,
    DevLogSynthesisSchema,
    GEMINI_DEVLOG_SYNTHESIS_SCHEMA,
    3
  );

  return {
    title: validated.title,
    badge: validated.badge,
    description: validated.description,
    highlights: validated.highlights,
    affectedSubsystems: validated.affectedSubsystems,
    mermaidDiagram: validated.mermaidDiagram || undefined,
  };
}
