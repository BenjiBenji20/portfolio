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
  suggestedProjectTitle: z.string().optional(),
  suggestedCategory: z.string().optional(),
  resolvedProjectSlug: z.string().optional(),
  articleAction: z.enum(['none', 'create_article', 'update_article']).default('none'),
  targetArticleSlug: z.string().optional(),
  articleRationale: z.string().optional(),
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
    suggestedProjectTitle: {
      type: 'STRING',
      description: 'Professional, human-friendly title for the project if not already provided',
    },
    suggestedCategory: {
      type: 'STRING',
      description: 'High-level project category (e.g. CLI Tool, Full-Stack Web, AI / Machine Learning, Infrastructure)',
    },
    resolvedProjectSlug: {
      type: 'STRING',
      description: 'Canonical Sanity project slug confirmed or matched via fetch_sanity_projects',
    },
    articleAction: {
      type: 'STRING',
      enum: ['none', 'create_article', 'update_article'],
      description: 'Decide whether this commit warrants a long-form Article: "none" for routine/WorkLog only, "create_article" for brand new landmark architecture/feature culmination, or "update_article" to patch an existing article that this change fundamentally alters',
    },
    targetArticleSlug: {
      type: 'STRING',
      description: 'When articleAction is "update_article", the slug of the existing published article to be updated/amended',
    },
    articleRationale: {
      type: 'STRING',
      description: 'Brief justification for the articleAction decision',
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
    .transform((val) => {
      if (!val || typeof val !== 'string' || val.trim().length === 0) return undefined;
      const res = validateAndSanitizeMermaid(val);
      if (!res.valid) {
        console.warn(`[ArticleParser] Dropping malformed section Mermaid diagram: ${res.errorReport}`);
        return undefined;
      }
      return res.sanitized;
    }),
  projectOverview: z.string().optional(),
  techStacks: z.array(z.string()).optional().default([]),
});

export type ValidatedDevLogSynthesis = z.infer<typeof DevLogSynthesisSchema>;

// 2b. Schemas for Article Synthesis & Patching
export const ArticleSectionSchema = z.object({
  heading: z.string().min(3, 'Section heading must be at least 3 characters'),
  body: z.string().min(20, 'Section body narrative must be at least 20 characters'),
  codeSnippet: z
    .object({
      code: z.string(),
      language: z.string().default('typescript'),
      filename: z.string().optional(),
    })
    .optional(),
  mermaidDiagram: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || typeof val !== 'string' || val.trim().length === 0) return undefined;
      const res = validateAndSanitizeMermaid(val);
      if (!res.valid) {
        console.warn(`[ArticleParser] Dropping malformed section Mermaid diagram: ${res.errorReport}`);
        return undefined;
      }
      return res.sanitized;
    }),
});

export const ArticleSynthesisSchema = z.object({
  title: z.string().min(5, 'title must be at least 5 characters'),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case')
    .or(z.string().min(3).transform((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))),
  excerpt: z
    .string()
    .min(10, 'excerpt must be at least 10 characters')
    .transform((val) => (val.length > 300 ? val.slice(0, 297) + '...' : val)),
  readTime: z.string().default('5 min read'),
  priorityValue: z.number().int().default(0),
  sections: z.array(ArticleSectionSchema).min(2, 'Article must have at least 2 structured sections'),
  tags: z.array(z.string()).default([]),
  takeaways: z.array(z.string()).default([]),
});

export type ValidatedArticleSynthesis = z.infer<typeof ArticleSynthesisSchema>;

export const ArticlePatchSchema = z.object({
  targetArticleSlug: z.string().min(1),
  addendumTitle: z.string().min(5),
  summary: z.string().min(10),
  sections: z.array(ArticleSectionSchema).min(1, 'Patch must have at least 1 section'),
});

export type ValidatedArticlePatch = z.infer<typeof ArticlePatchSchema>;

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

export const GEMINI_ARTICLE_SECTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    heading: {
      type: 'STRING',
      description: 'Section heading (e.g. "Core Problem & Design Trade-offs", "Architectural Mechanics")',
    },
    body: {
      type: 'STRING',
      description: 'Detailed multi-paragraph technical narrative explaining engineering decisions, mechanics, or benchmarks',
    },
    codeSnippet: {
      type: 'OBJECT',
      properties: {
        code: { type: 'STRING', description: 'Significant code or configuration snippet' },
        language: { type: 'STRING', description: 'Language identifier (e.g. typescript, python, bash)' },
        filename: { type: 'STRING', description: 'Optional relative path or filename' },
      },
      required: ['code'],
    },
    mermaidDiagram: {
      type: 'STRING',
      description: 'Architecture diagram (flowchart TD/LR or sequenceDiagram) illustrating this section with double-quoted node labels and plain unquoted pipe edge labels',
    },
  },
  required: ['heading', 'body'],
};

export const GEMINI_ARTICLE_SYNTHESIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: {
      type: 'STRING',
      description: 'Authoritative, publication-grade engineering article title',
    },
    slug: {
      type: 'STRING',
      description: 'Clean kebab-case URL slug (e.g. autonomous-devlog-engine)',
    },
    excerpt: {
      type: 'STRING',
      description: 'Compelling teaser summary displayed in the article grid (maximum 300 characters)',
    },
    readTime: {
      type: 'STRING',
      description: 'Estimated reading time, e.g. "6 min read"',
    },
    priorityValue: {
      type: 'NUMBER',
      description: 'Display weight integer (default: 0)',
    },
    sections: {
      type: 'ARRAY',
      items: GEMINI_ARTICLE_SECTION_SCHEMA,
      minItems: 2,
      description: 'Array of at least 2 structured technical sections covering the milestone',
    },
    tags: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Relevant tags and topic keywords',
    },
    takeaways: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Bullet list of core engineering takeaways and learnings',
    },
  },
  required: ['title', 'slug', 'excerpt', 'readTime', 'sections'],
};

export const GEMINI_ARTICLE_PATCH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    targetArticleSlug: {
      type: 'STRING',
      description: 'Slug of the existing article being updated',
    },
    addendumTitle: {
      type: 'STRING',
      description: 'Title for the architectural update/addendum section',
    },
    summary: {
      type: 'STRING',
      description: 'Summary of the architectural shift or enhancement',
    },
    sections: {
      type: 'ARRAY',
      items: GEMINI_ARTICLE_SECTION_SCHEMA,
      minItems: 1,
      description: 'New or revised sections to append to the article',
    },
  },
  required: ['targetArticleSlug', 'addendumTitle', 'summary', 'sections'],
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
