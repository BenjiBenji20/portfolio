import { z } from 'zod';
import type { PortfolioConfig } from '@/types/githubWebhook';

/**
 * Dynamic Zod schema for .portfolio.json
 *
 * Tier 1 (Required Governance Invariants):
 * - track: boolean (explicit kill switch)
 * - requireHumanApproval: boolean (governance gate; accepts requiredHumanApproval as alias)
 * - mediaPreferences: { captureScreenshots: boolean, generateArchitectureDiagrams: boolean }
 *
 * Tier 2 (Dual-Mode Operational Keys - Human Specified or Agent Decides):
 * - primaryBranch: string (defaults to 'main')
 * - projectTitle: string (optional; agent autonomously synthesizes if missing)
 * - projectSlug: string (optional; derived from title or repo if missing)
 * - category: string (optional; agent autonomously classifies if missing)
 * - liveUrl: string (optional; triggers Playwright screenshot if captureScreenshots is true)
 * - ignoreDirectory: string[] (defaults to [])
 *
 * Tier 3 (Communication Bridge - Distinct Temporal Scopes):
 * - projectOverview: string (persistent standing identity; aliases: note, projectSummary)
 * - developerDirective: string (ephemeral per-commit steering; aliases: userMessage, focusDirective)
 * - targetAudience: string (audience/tone calibration; alias: customAudience)
 *
 * Tier 4 (Arbitrary Dynamic Keys):
 * - Preserved via .passthrough() and injected into prompt directives.
 */
export const DynamicPortfolioConfigSchema = z.preprocess((val) => {
  if (typeof val !== 'object' || val === null) return val;
  const raw = { ...(val as Record<string, unknown>) };

  // Normalize aliases into canonical keys
  if (raw.requiredHumanApproval !== undefined && raw.requireHumanApproval === undefined) {
    raw.requireHumanApproval = raw.requiredHumanApproval;
  }
  if (raw.note !== undefined && raw.projectOverview === undefined) {
    raw.projectOverview = raw.note;
  } else if (raw.projectSummary !== undefined && raw.projectOverview === undefined) {
    raw.projectOverview = raw.projectSummary;
  }

  if (raw.userMessage !== undefined && raw.developerDirective === undefined) {
    raw.developerDirective = raw.userMessage;
  } else if (raw.focusDirective !== undefined && raw.developerDirective === undefined) {
    raw.developerDirective = raw.focusDirective;
  }

  if (raw.customAudience !== undefined && raw.targetAudience === undefined) {
    raw.targetAudience = raw.customAudience;
  }

  return raw;
}, z
  .object({
    // Tier 1: Required Governance Invariants
    track: z.boolean({ message: 'The "track" field is required (boolean).' }),
    requireHumanApproval: z.boolean({
      message: 'The "requireHumanApproval" (or "requiredHumanApproval") field is required (boolean).',
    }),
    mediaPreferences: z.object(
      {
        captureScreenshots: z.boolean({
          message: '"mediaPreferences.captureScreenshots" is required (boolean).',
        }),
        generateArchitectureDiagrams: z.boolean({
          message: '"mediaPreferences.generateArchitectureDiagrams" is required (boolean).',
        }),
      },
      { message: 'The "mediaPreferences" object is required with explicit boolean switches.' }
    ).passthrough(),

    // Tier 2: Dual-Mode Operational Keys (Human override or Agent decides)
    primaryBranch: z.string().default('main'),
    projectTitle: z.string().min(1).optional(),
    projectSlug: z.string().min(1).optional(),
    category: z.string().optional(),
    liveUrl: z.string().optional(),
    ignoreDirectory: z.array(z.string()).default([]),

    // Tier 3: Communication Bridge (Persistent vs Ephemeral vs Audience)
    projectOverview: z.string().optional(),
    developerDirective: z.string().optional(),
    targetAudience: z.string().optional(),

    // Tooling / Schemas
    schema: z.string().optional(),
    $schema: z.string().optional(),

    // Backward compatibility aliases preserved in schema for typing
    requiredHumanApproval: z.boolean().optional(),
    note: z.string().optional(),
    projectSummary: z.string().optional(),
    userMessage: z.string().optional(),
    focusDirective: z.string().optional(),
    customAudience: z.string().optional(),
  })
  .passthrough()
);

export type ValidatedPortfolioConfig = z.infer<typeof DynamicPortfolioConfigSchema> & PortfolioConfig;

export interface RunnerInputs {
  targetRepo: string;
  commitSha: string;
  baseSha?: string;
  branch: string;
  prNumber?: string;
  prTitle?: string;
  sender?: string;
}

export interface TriageResult {
  publishable: boolean;
  score: number;
  rationale: string;
  suggestedBadge?: string;
  suggestedProjectTitle?: string;
  suggestedCategory?: string;
}

export interface FileSummary {
  filename: string;
  responsibility: string;
  keyChanges: string[];
  architecturalImpact?: string;
}

export interface DevLogSynthesisResult {
  title: string;
  badge: string;
  description: string;
  highlights: string[];
  affectedSubsystems: string[];
  mermaidDiagram?: string;
  rawBlocks?: unknown[];
  projectOverview?: string;
  techStacks?: string[];
}
