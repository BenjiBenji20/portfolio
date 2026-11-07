import type { z } from 'zod';
import type {
  ValidatedPortfolioConfig,
  TriageResult,
  DevLogSynthesisResult,
  FileSummary,
  ProjectHistoryDigest,
  ArticleSynthesisResult,
  ArticlePatchResult,
  FullArticleData,
} from '../types';
import type { GitHubContext, FileDelta } from './githubContextService';
import {
  TriageResponseSchema,
  DevLogSynthesisSchema,
  BatchFileSummarySchema,
  ArticleSynthesisSchema,
  ArticlePatchSchema,
  GEMINI_TRIAGE_RESPONSE_SCHEMA,
  GEMINI_DEVLOG_SYNTHESIS_SCHEMA,
  GEMINI_BATCH_FILE_SUMMARY_SCHEMA,
  GEMINI_ARTICLE_SYNTHESIS_SCHEMA,
  GEMINI_ARTICLE_PATCH_SCHEMA,
  extractZodDiagnostics,
} from '../parsers/aiResponseParser';
import { geminiQuotaGuardrail } from '../utils/geminiQuotaGuardrail';
import {
  VALID_BADGES,
  SANITY_WORKLOG_SCHEMA_CONTEXT_PROMPT,
  SANITY_PROJECT_SCHEMA_CONTEXT_PROMPT,
  SANITY_ARTICLE_SCHEMA_CONTEXT_PROMPT,
  MERMAID_DIAGRAM_FORMAT_PROMPT,
} from '../utils/schemaContext';

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
      maxOutputTokens: 8192,
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
  maxRetries = 4,
  preferredModel?: string
): Promise<T> {
  let currentPrompt = initialPrompt;
  let temperature = 0.2;
  let lastRawOutput = '';
  let lastErrorReport = '';
  let activeModel = preferredModel || PRIMARY_MODEL;
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

      // Rotate model on repeat validation failures to break deterministic sampling loops
      if (attempt >= 2 && fallbackIndex < FALLBACK_MODELS.length) {
        const nextModel = FALLBACK_MODELS[fallbackIndex++];
        if (nextModel !== activeModel) {
          activeModel = nextModel;
          console.warn(
            `[GeminiService] [${taskName}] Rotating model to ${activeModel} for attempt ${attempt + 1} to break schema validation loop...`
          );
        }
        temperature = 0.1;
      } else {
        temperature = 0.0;
      }

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
  config: ValidatedPortfolioConfig,
  historyDigest?: ProjectHistoryDigest
): Promise<TriageResult> {
  console.log('[GeminiService] Running Stage 1: Lightweight Editorial Triage Gate (Stat-enforced)...');

  const titleContext = config.projectTitle
    ? `for project "${config.projectTitle}"`
    : `(Project title omitted by developer: please synthesize a suggestedProjectTitle and suggestedCategory based on the repository content)`;

  const historyBlock = historyDigest && historyDigest.recentWorkLogs.length > 0
    ? `RECENT PROJECT MILESTONES (Chronological Memory for this project):
${historyDigest.recentWorkLogs.map((l) => `- [${l.date}] (${l.badge}) "${l.title}": ${l.description}`).join('\n')}
`
    : 'RECENT PROJECT MILESTONES: No prior milestones recorded (Initial project development).\n';

  const articlesBlock = historyDigest && historyDigest.existingArticles.length > 0
    ? `EXISTING PUBLISHED ARTICLES FOR THIS PROJECT:
${historyDigest.existingArticles.map((a) => `- "${a.title}" (slug: "${a.slug}")${a.leadParagraph ? `: ${a.leadParagraph.slice(0, 120)}...` : ''}`).join('\n')}
`
    : '';

  const prompt = `
Evaluate the engineering significance of this commit/PR ${titleContext}.

METADATA & SCOPE:
- PR / Commit Title: ${prTitle}
- PR Description: ${gitContext.prBody || 'None provided'}
- Primary Commit Message: ${gitContext.commitMessage || 'None provided'}
- Changed File Count: ${gitContext.changedFiles.length}

${config.projectOverview ? `PROJECT OVERVIEW (Standing Context):\n"${config.projectOverview}"\n` : ''}
${config.developerDirective ? `DEVELOPER DIRECTIVE (Current Run Priority):\n"${config.developerDirective}"\n` : ''}

${historyBlock}
${articlesBlock}

DIFF STAT OVERVIEW:
\`\`\`text
${gitContext.diffStat || gitContext.changedFiles.map((f) => `- ${f}`).join('\n')}
\`\`\`

TRIAGE EVALUATION RULES:
- Score 1-4 (REJECT): Routine dependency updates, formatting/linting fixes, minor typo edits, or empty scaffolding.
- Score 5-6 (BORDERLINE): Minor refactors or simple single-line bug fixes without architectural impact.
- Score 7-10 (APPROVE): Significant feature additions, new CLI apps, architectural state changes, security hardening, or optimization.
${!config.projectTitle ? '- Missing Project Title: You MUST populate "suggestedProjectTitle" with a clean, professional, human-friendly title based on the code purpose (e.g. "Dead Link Checker CLI", "Oravista Portfolio").' : ''}
${!config.category ? '- Missing Category: You MUST populate "suggestedCategory" with a matching domain classification (e.g. "CLI Tool", "Full-Stack Web", "AI / Machine Learning", "Automation", "Infrastructure").' : ''}

CUMULATIVE MILESTONE & ARTICLE EVALUATION:
${config.generateArticle ? '- Advisory Directive: "generateArticle": true is set in .portfolio.json. The developer signals an article may be desired, but YOU MUST INDEPENDENTLY VERIFY whether this commit has genuine technical depth and architecture worthy of an article. If routine or minor, keep articleAction: "none".' : ''}
- Analyze this commit against the RECENT PROJECT MILESTONES listed above to detect cumulative progress.
- Landmark Milestone Thresholds:
  * "create_article": ONLY when this commit culminates a major milestone (e.g. initial production release, breakthrough Architecture, deep Security overhaul, or landmark multi-phase Feature culmination) not covered by existing articles.
  * "update_article": ONLY when this commit fundamentally modifies or evolves an architecture described in an EXISTING article listed above. Set "targetArticleSlug" to that article\'s slug and describe the architectural delta in "articleRationale".
  * "none": For standard features, bug fixes, routine refactors, and minor iterations that belong in WorkLogs only.
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
      suggestedProjectTitle: validated.suggestedProjectTitle,
      suggestedCategory: validated.suggestedCategory,
      articleAction: validated.articleAction || 'none',
      targetArticleSlug: validated.targetArticleSlug,
      articleRationale: validated.articleRationale,
    };
  } catch (err) {
    console.warn('[GeminiService] Triage prompt failed after self-healing attempts. Error details:', err);
    return {
      publishable: true,
      score: 7,
      rationale: 'Fallback approval due to schema verification error after self-healing',
      suggestedBadge: 'Engineering',
      articleAction: 'none',
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
  fileSummaries: FileSummary[] = [],
  historyDigest?: ProjectHistoryDigest
): Promise<DevLogSynthesisResult> {
  console.log('[GeminiService] Running Stage 3: Cross-Referenced Narrative Synthesis & Mermaid Diagram...');

  const generateDiagram = config.mediaPreferences?.generateArchitectureDiagrams !== false;

  // Differentiate standing project identity from ephemeral steering and audience calibration
  const standingOverviewBlock = config.projectOverview
    ? `PROJECT OVERVIEW (Standing Purpose & Context):\n"${config.projectOverview}"\n(Grounding: Use this as foundational context for the system purpose.)`
    : '';

  const developerDirectiveBlock = config.developerDirective
    ? `DEVELOPER DIRECTIVE (Current Run High Priority Steering):\n"${config.developerDirective}"\n(CRITICAL: The human developer gave explicit steering for this specific update. Strictly prioritize this directive in your title, highlights, and narrative emphasis over default heuristics.)`
    : '';

  const targetAudienceBlock = `TARGET AUDIENCE: "${config.targetAudience || 'Technical Peers, Senior Engineers, and Technical Recruiters'}"\nCalibrate technical vocabulary, depth of explanation, and architectural perspective specifically for this target audience.`;

  const historyContinuityBlock = historyDigest && historyDigest.recentWorkLogs.length > 0
    ? `RECENT PROJECT MILESTONES (Chronological Progression):
${historyDigest.recentWorkLogs.map((l) => `- [${l.date}] (${l.badge}) "${l.title}"`).join('\n')}
(Continuity: If this update builds upon previous worklogs, connect the technical progression naturally without repeating old diffs.)`
    : '';

  // Collect Tier 4 dynamic custom parameters from .portfolio.json
  const recognizedConfigKeys = new Set([
    'track',
    'requireHumanApproval',
    'requiredHumanApproval',
    'mediaPreferences',
    'primaryBranch',
    'projectTitle',
    'projectSlug',
    'category',
    'liveUrl',
    'ignoreDirectory',
    'projectOverview',
    'developerDirective',
    'targetAudience',
    'schema',
    '$schema',
    'note',
    'projectSummary',
    'userMessage',
    'focusDirective',
    'customAudience',
  ]);

  const dynamicDirectives: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    if (!recognizedConfigKeys.has(key) && value !== undefined && value !== null) {
      const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
      dynamicDirectives.push(`- Dynamic Parameter [${key}]: "${displayVal}"`);
    }
  }

  const dynamicDirectivesBlock = dynamicDirectives.length > 0
    ? `ADDITIONAL DYNAMIC PARAMETERS (.portfolio.json):\n${dynamicDirectives.join('\n')}`
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
    : 'ARCHITECTURE DIAGRAMS ARE DISABLED ("generateArchitectureDiagrams": false). Do NOT generate any mermaid diagram. Do not output any mermaidDiagram content.';

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

${standingOverviewBlock ? `${standingOverviewBlock}\n` : ''}
${developerDirectiveBlock ? `${developerDirectiveBlock}\n` : ''}
${targetAudienceBlock ? `${targetAudienceBlock}\n` : ''}
${historyContinuityBlock ? `${historyContinuityBlock}\n` : ''}
${dynamicDirectivesBlock ? `${dynamicDirectivesBlock}\n` : ''}

CHANGE CONTEXT:
- PR / Commit Title: ${prTitle}
- Suggested Badge: ${triage.suggestedBadge || 'Feature'}
- PR Description: ${gitContext.prBody || 'None provided'}
- Commit Message: ${gitContext.commitMessage}

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

  const diagramGovernanceInstruction = generateDiagram
    ? `\n${MERMAID_DIAGRAM_FORMAT_PROMPT}`
    : '\nCRITICAL GOVERNANCE OVERRIDE: The developer explicitly disabled architecture diagrams ("generateArchitectureDiagrams": false). Do NOT output any mermaid diagram or mermaidDiagram property.';

  const systemInstruction = `
You are my proxy — a Senior Technical Writer and Software Architect. Write as an authentic human engineer documenting real production momentum.

${SANITY_WORKLOG_SCHEMA_CONTEXT_PROMPT}

${SANITY_PROJECT_SCHEMA_CONTEXT_PROMPT}

STRICT VOICE & VOCABULARY INVARIANTS:
- FORBIDDEN AI BUZZWORDS: Never use "In this modern landscape", "Delve into", "Pivotal", "Testament to", "Beacon", "A game-changer", "Revolutionary", "Let's explore", "In today's fast-paced world", "Exciting new feature".
- GROUNDING: Cite concrete filenames, architectural patterns (e.g. "HMAC-SHA256 handshake", "Zod safeParse", "sliding-window rate limiter"), and measurable outcomes.
- ZERO FABRICATION: Do not invent dependencies or link random external images.
- Follow the required JSON schema strictly.
${dynamicDirectivesBlock}${diagramGovernanceInstruction}
`;

  // Dynamically tailor the JSON responseSchema: omit mermaidDiagram if diagrams are disabled
  const devlogResponseSchema = {
    ...GEMINI_DEVLOG_SYNTHESIS_SCHEMA,
    properties: { ...GEMINI_DEVLOG_SYNTHESIS_SCHEMA.properties },
  };
  if (!generateDiagram) {
    delete (devlogResponseSchema.properties as Record<string, unknown>).mermaidDiagram;
  }

  const validated = await executeWithSelfHealing(
    'DevLogSynthesis',
    prompt,
    systemInstruction,
    DevLogSynthesisSchema,
    devlogResponseSchema,
    4
  );

  return {
    title: validated.title,
    badge: validated.badge,
    description: validated.description,
    highlights: validated.highlights,
    affectedSubsystems: validated.affectedSubsystems,
    mermaidDiagram: generateDiagram ? (validated.mermaidDiagram || undefined) : undefined,
    projectOverview: validated.projectOverview,
    techStacks: validated.techStacks,
  };
}

/**
 * Synthesizes a deep-dive, publication-grade technical Article for a landmark project milestone.
 * Produces structured sections with in-depth narrative, code blocks, and architecture diagrams.
 */
export async function synthesizeArticle(
  headline: string,
  gitContext: GitHubContext,
  config: ValidatedPortfolioConfig,
  triage: TriageResult,
  fileSummaries: FileSummary[] = [],
  historyDigest?: ProjectHistoryDigest
): Promise<ArticleSynthesisResult> {
  console.log('[GeminiService] Synthesizing Long-Form Technical Article (Landmark Milestone)...');

  const generateDiagram = config.mediaPreferences?.generateArchitectureDiagrams !== false;

  const summariesBlock =
    fileSummaries.length > 0
      ? `DISTILLED MODULE SUMMARIES:\n${fileSummaries
          .map(
            (f) =>
              `### ${f.filename}\n- Role: ${f.responsibility}\n- Key Changes: ${f.keyChanges.join(', ')}\n- Architectural Impact: ${f.architecturalImpact || 'None'}`
          )
          .join('\n\n')}`
      : 'No individual file summaries available.';

  const historyBlock =
    historyDigest && historyDigest.recentWorkLogs.length > 0
      ? `HISTORICAL MILESTONE CONTEXT (Past Worklogs for Continuity):\n${historyDigest.recentWorkLogs
          .map((l) => `- [${l.date}] (${l.badge}) "${l.title}": ${l.description}`)
          .join('\n')}`
      : '';

  const prompt = `
You are tasked with authoring an authoritative, publication-grade deep-dive technical engineering Article for "${config.projectTitle || 'Engineering Project'}".

LANDMARK EVENT & METADATA:
- Commit/PR Headline: "${headline}"
- Triage Rationale: "${triage.rationale}"
- Category: "${config.category || triage.suggestedCategory || 'Engineering'}"
${config.projectOverview ? `PROJECT OVERVIEW:\n"${config.projectOverview}"\n` : ''}
${config.developerDirective ? `DEVELOPER DIRECTIVE:\n"${config.developerDirective}"\n` : ''}
TARGET AUDIENCE: "${config.targetAudience || 'Senior Software Engineers, Staff Architects, Technical Leads'}"

${historyBlock}

${summariesBlock}

ARTICLE REQUIREMENTS & SPECIFICATION:
1. Title: Authoritative, compelling, professional technical title (e.g. "Inside Benjineer: Designing an Autonomous Multi-Agent DevLog Engine").
2. Slug: Clean lowercase kebab-case (e.g. "autonomous-agent-runner-guardrails").
3. Excerpt: Concise 2-3 sentence teaser summary (MAXIMUM 300 characters).
4. Estimated Read Time: e.g. "6 min read" or "8 min read".
5. Structured Sections (CRITICAL: MUST contain at least 2 complete sections, ideally 3-4):
   - Section 1: Problem Space & Architectural Motivation (Why this system/feature needed to exist, past bottlenecks).
   - Section 2: Core Engineering Architecture & Implementation Mechanics (Deep dive into technical decisions, interfaces, state management, edge cases).
   - Section 3: Verification, Guardrails, or Operational Guarantees (How it is secured, tested, rate-limited, or validated).
   - Each section MUST contain:
     * heading: Clear, engaging section title.
     * body: Thorough, multi-paragraph engineering explanation (no fluff, concrete technical rigor).
     * codeSnippet (optional): Significant code snippet demonstrating interfaces, core algorithms, or configs.
     * mermaidDiagram (optional, ONLY if enabled): Architecture flowchart or sequence diagram. If included, ensure all shape delimiters are completely closed. If not needed, omit.
6. Key Architectural Takeaways: 3-5 bulleted engineering learnings or design principles.

STRICT VOICE & VOCABULARY INVARIANTS:
- FORBIDDEN BUZZWORDS: Never use "In this modern landscape", "Delve into", "Pivotal", "Testament to", "Beacon", "A game-changer", "Revolutionary", "Let's explore", "In today's fast-paced world".
- GROUNDING: Cite concrete filenames, functions, data flows, and security/performance guarantees.
- DIAGRAM RULES:
  * Allowed diagram types: ONLY "flowchart TD", "flowchart LR", or "sequenceDiagram".
  * Node labels MUST ALWAYS be wrapped in double quotes inside shape delimiters: ID["Step Name"].
  * Edge labels in pipes MUST NOT have any quotes: A -->|Execute Command| B.
  * Connectors: Standard ASCII arrows only (--> , -.-> , ==>).

Literal Mermaid Flowchart Example:
flowchart TD
  Client["User / Worker"] -->|Execute Command| Core["Core Engine"]
  Core -->|Network Probe| Target["Remote Endpoint"]
  Target -.->|Status / Diagnostic| Auditor["AI Auditor"]

Follow the JSON schema strictly.
`;

  const mermaidContext = generateDiagram ? `\n${MERMAID_DIAGRAM_FORMAT_PROMPT}` : '';

  const systemInstruction = `You are a Principal Software Engineer and technical author for "Benjineer" (Agentic Writer).
Write with high authority, exact technical vocabulary, clear architectural depth, and zero fluff.

${SANITY_ARTICLE_SCHEMA_CONTEXT_PROMPT}${mermaidContext}`;

  // Dynamically tailor response schema if diagrams are disabled
  const articleResponseSchema = JSON.parse(JSON.stringify(GEMINI_ARTICLE_SYNTHESIS_SCHEMA));
  if (!generateDiagram) {
    delete articleResponseSchema.properties.sections.items.properties.mermaidDiagram;
  }

  const validated = await executeWithSelfHealing(
    'ArticleSynthesis',
    prompt,
    systemInstruction,
    ArticleSynthesisSchema,
    articleResponseSchema,
    4,
    'gemini-2.5-flash'
  );

  return validated;
}

/**
 * Synthesizes an architectural addendum to update an existing article
 * when a commit fundamentally alters or evolves an existing system architecture.
 */
export async function synthesizeArticlePatch(
  targetArticleSlug: string,
  existingArticle: FullArticleData | null,
  headline: string,
  gitContext: GitHubContext,
  config: ValidatedPortfolioConfig,
  triage: TriageResult,
  fileSummaries: FileSummary[] = []
): Promise<ArticlePatchResult> {
  console.log(`[GeminiService] Synthesizing Architecture Addendum for Article "${targetArticleSlug}"...`);

  const generateDiagram = config.mediaPreferences?.generateArchitectureDiagrams !== false;

  const summariesBlock =
    fileSummaries.length > 0
      ? `DISTILLED MODULE SUMMARIES:\n${fileSummaries
          .map(
            (f) =>
              `### ${f.filename}\n- Role: ${f.responsibility}\n- Key Changes: ${f.keyChanges.join(', ')}\n- Architectural Impact: ${f.architecturalImpact || 'None'}`
          )
          .join('\n\n')}`
      : '';

  const existingContext = existingArticle
    ? `EXISTING ARTICLE TITLE: "${existingArticle.title}"
EXISTING EXCERPT: "${existingArticle.excerpt || 'None'}"`
    : `TARGET ARTICLE SLUG: "${targetArticleSlug}"`;

  const prompt = `
A significant architectural update has occurred that evolves the system architecture described in an existing published article.
Synthesize an "Architecture Addendum / Update" section to append to this article.

EXISTING ARTICLE CONTEXT:
${existingContext}

NEW COMMIT / EVOLUTION EVENT:
- Headline: "${headline}"
- Triage Rationale: "${triage.rationale}"
- Target Audience: "${config.targetAudience || 'Senior Engineers'}"
${summariesBlock}

ADDENDUM REQUIREMENTS:
1. targetArticleSlug: "${targetArticleSlug}"
2. addendumTitle: e.g. "Architecture Update: [What Changed and Why]"
3. summary: Concise 2-3 sentence overview of this architectural evolution.
4. sections: 1-2 structured technical sections detailing:
   - What architectural trade-offs or scaling bottlenecks prompted this change.
   - The concrete implementation mechanics and new data flows.
   - Code snippet or updated Mermaid diagram if applicable.

STRICT VOICE & VOCABULARY INVARIANTS:
- No fluff, no buzzwords ("pivotal", "game changer", "delve").
- Concrete, grounded explanations.
- Diagram rules: Node labels double-quoted, pipe edge labels unquoted, ASCII arrows only.

Follow the JSON schema strictly.
`;

  const mermaidContext = generateDiagram ? `\n${MERMAID_DIAGRAM_FORMAT_PROMPT}` : '';

  const systemInstruction = `You are a Principal Software Engineer (Agentic Writer). Synthesize a clean, authoritative architectural update addendum for an existing engineering article.

${SANITY_ARTICLE_SCHEMA_CONTEXT_PROMPT}${mermaidContext}`;

  const patchResponseSchema = JSON.parse(JSON.stringify(GEMINI_ARTICLE_PATCH_SCHEMA));
  if (!generateDiagram) {
    delete patchResponseSchema.properties.sections.items.properties.mermaidDiagram;
  }

  const validated = await executeWithSelfHealing(
    'ArticlePatchSynthesis',
    prompt,
    systemInstruction,
    ArticlePatchSchema,
    patchResponseSchema,
    4,
    'gemini-2.5-flash'
  );

  return validated;
}

