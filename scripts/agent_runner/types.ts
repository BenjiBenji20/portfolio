import { z } from 'zod';
import type { PortfolioConfig } from '@/types/githubWebhook';

/**
 * Dynamic Zod schema for .portfolio.json
 * Required fields: track, projectTitle, projectSlug
 * Uses .passthrough() so any custom keys the user adds in the future are dynamically preserved.
 */
export const DynamicPortfolioConfigSchema = z
  .object({
    track: z.boolean(),
    projectTitle: z.string().min(1, 'projectTitle is required'),
    projectSlug: z.string().min(1, 'projectSlug is required'),
    schema: z.string().optional(),
    $schema: z.string().optional(),
    requireHumanApproval: z.boolean().default(false),
    note: z.string().optional(),
    ignoreDirectory: z.array(z.string()).default([]),
    category: z.string().optional(),
    liveUrl: z.string().optional(),
    primaryBranch: z.string().default('main'),
    mediaPreferences: z
      .object({
        captureScreenshots: z.boolean().default(false),
        generateArchitectureDiagrams: z.boolean().default(true),
      })
      .passthrough()
      .default({ captureScreenshots: false, generateArchitectureDiagrams: true }),
  })
  .passthrough();

export type ValidatedPortfolioConfig = z.infer<typeof DynamicPortfolioConfigSchema> & PortfolioConfig;

export interface RunnerInputs {
  targetRepo: string;
  commitSha: string;
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
}

export interface DevLogSynthesisResult {
  title: string;
  badge: string;
  description: string;
  highlights: string[];
  affectedSubsystems: string[];
  mermaidDiagram?: string;
  rawBlocks?: unknown[];
}
