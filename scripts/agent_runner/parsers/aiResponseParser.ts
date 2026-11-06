import { z } from 'zod';
import { VALID_BADGES } from '../utils/schemaContext';
import { validateAndSanitizeMermaid } from '../utils/mermaidSyntaxValidator';

/**
 * AI Response Parser & Zod Verification Engine
 * 
 * Provides strict structural validation, diagnostic extraction, and schema enforcement
 * for all deterministic Gemini 3.5-flash-lite responses.
 */

// 1. Schema for Prompt 1: Tier 3 Editorial Triage
export const TriageResponseSchema = z.object({
  publishable: z.boolean(),
  score: z.number().min(1).max(10),
  rationale: z.string().min(5, 'rationale must be at least 5 characters'),
  suggestedBadge: z.string().default('Engineering'),
});

export type ValidatedTriageResponse = z.infer<typeof TriageResponseSchema>;

// Corresponding Gemini API responseSchema definition
export const GEMINI_TRIAGE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    publishable: {
      type: 'BOOLEAN',
      description: 'Whether this change represents meaningful engineering momentum worthy of publishing',
    },
    score: {
      type: 'NUMBER',
      description: 'Significance score from 1 to 10',
    },
    rationale: {
      type: 'STRING',
      description: 'Concise explanation of the scoring decision',
    },
    suggestedBadge: {
      type: 'STRING',
      description: 'Category badge, e.g. Architecture, Security, Performance, Optimization',
    },
  },
  required: ['publishable', 'score', 'rationale', 'suggestedBadge'],
};

// 2. Schema for Prompt 2 & 3: DevLog Narrative Synthesis & Mermaid Diagram
export const DevLogSynthesisSchema = z.object({
  title: z.string().min(3, 'title must be at least 3 characters'),
  badge: z.enum(VALID_BADGES, {
    message: `badge must be one of: ${VALID_BADGES.join(', ')}`,
  }),
  description: z.string().min(10, 'description must be at least 10 characters'),
  highlights: z.array(z.string().min(5)).min(1, 'highlights array must contain at least 1 bullet point'),
  affectedSubsystems: z.array(z.string()).default([]),
  mermaidDiagram: z
    .string()
    .optional()
    .nullable()
    .superRefine((val, ctx) => {
      if (!val) return;
      const res = validateAndSanitizeMermaid(val);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.errorReport || 'Invalid Mermaid syntax',
        });
      }
    })
    .transform((val) => {
      if (!val) return undefined;
      const res = validateAndSanitizeMermaid(val);
      return res.valid ? res.sanitized : undefined;
    }),
  projectOverview: z.string().optional(),
  techStacks: z.array(z.string()).optional().default([]),
});

export type ValidatedDevLogSynthesis = z.infer<typeof DevLogSynthesisSchema>;

// 3. Schema for Stage 2: Per-File Semantic Distillation (Map Stage)
export const FileSummarySchema = z.object({
  filename: z.string(),
  responsibility: z.string().min(3, 'responsibility must be at least 3 characters'),
  keyChanges: z.array(z.string()).default([]),
  architecturalImpact: z.string().optional().default('None'),
});

export type ValidatedFileSummary = z.infer<typeof FileSummarySchema>;

export const BatchFileSummarySchema = z.object({
  files: z.array(FileSummarySchema),
});

export type ValidatedBatchFileSummary = z.infer<typeof BatchFileSummarySchema>;

export const GEMINI_FILE_SUMMARY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    filename: {
      type: 'STRING',
      description: 'The filename analyzed',
    },
    responsibility: {
      type: 'STRING',
      description: '1-2 sentence distillation of core responsibility and technical purpose',
    },
    keyChanges: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Concrete functions, routes, state mutations, or interface changes',
    },
    architecturalImpact: {
      type: 'STRING',
      description: 'Side effects, dependencies on other modules, or performance/security impact',
    },
  },
  required: ['filename', 'responsibility', 'keyChanges'],
};

export const GEMINI_BATCH_FILE_SUMMARY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    files: {
      type: 'ARRAY',
      items: GEMINI_FILE_SUMMARY_SCHEMA,
      description: 'Array of distilled file summaries',
    },
  },
  required: ['files'],
};

// Corresponding Gemini API responseSchema definition
export const GEMINI_DEVLOG_SYNTHESIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: {
      type: 'STRING',
      description: 'Concise, outcome-oriented engineering title without commit hashes',
    },
    badge: {
      type: 'STRING',
      enum: Array.from(VALID_BADGES),
      description: `Category badge strictly matching one of: ${VALID_BADGES.join(', ')}`,
    },
    description: {
      type: 'STRING',
      description: '2-3 sentence overview highlighting practical value and technical approach',
    },
    highlights: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '3-4 bullet points detailing concrete patterns or performance gains',
    },
    affectedSubsystems: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'List of affected subsystems or modules',
    },
    mermaidDiagram: {
      type: 'STRING',
      description: 'Raw Mermaid diagram string with double-quoted node labels without markdown backticks',
    },
    projectOverview: {
      type: 'STRING',
      description: 'Professional 1-2 sentence overview of the parent project and its domain',
    },
    techStacks: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'List of relevant technical tools, languages, or frameworks used (e.g. Python, Requests, Next.js)',
    },
  },
  required: ['title', 'badge', 'description', 'highlights', 'affectedSubsystems'],
};

export interface DiagnosticsResult<T> {
  valid: boolean;
  data?: T;
  errorReport?: string;
}

/**
 * Extracts actionable Zod diagnostic reports for the self-healing feedback loop.
 * Explains exactly which field failed and why.
 */
export function extractZodDiagnostics<T>(
  rawText: string,
  schema: z.ZodType<T>
): DiagnosticsResult<T> {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawText);
  } catch (err) {
    return {
      valid: false,
      errorReport: `JSON Parse Failure: The output is not valid parseable JSON. (${err instanceof Error ? err.message : String(err)}).`,
    };
  }

  const result = schema.safeParse(parsedJson);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  * Field: "${issue.path.join('.') || 'root'}" -> Error: ${issue.message}`)
      .join('\n');

    return {
      valid: false,
      errorReport: `Schema Constraints Violated:\n${formatted}`,
    };
  }

  return {
    valid: true,
    data: result.data,
  };
}

/**
 * Reusable Zod Dependency-like Parser
 * Parses raw JSON string and executes strict schema verification.
 */
export function parseAndValidateAIResponse<T>(
  rawText: string,
  schema: z.ZodType<T>,
  schemaName = 'AIResponse'
): T {
  const diagnostics = extractZodDiagnostics(rawText, schema);

  if (!diagnostics.valid || !diagnostics.data) {
    throw new Error(`[${schemaName}Parser] ${diagnostics.errorReport || 'Unknown validation failure'}`);
  }

  return diagnostics.data;
}
