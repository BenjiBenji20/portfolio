import type { ValidatedPortfolioConfig, DevLogSynthesisResult } from '../types';
import { VALID_BADGES, type ValidBadge, type ValidProjectStatus } from './schemaContext';

/**
 * Factory builders that assemble 100% schema-compliant payloads
 * for Sanity Content Lake mutations, populating all required fields and invariants.
 */

export interface SanityProjectDocument {
  _id: string;
  _type: 'project';
  title: string;
  slug: { _type: 'slug'; current: string };
  projectType: string;
  shortDescription: string;
  status: ValidProjectStatus;
  author: 'Agentic Writer';
  priorityValue: number;
  featured: boolean;
  hidden: boolean;
  website?: string;
  repository?: string;
  techStacks: string[];
  collaborators: unknown[];
  media: unknown[];
  content: unknown[];
}

export interface SanityWorkLogDocument {
  _id: string;
  _type: 'workLog';
  title: string;
  badge: ValidBadge;
  date: string;
  description: string;
  commitSha: string;
  author: 'Agentic Writer';
  developers: string[];
  content: unknown[];
  project: { _type: 'reference'; _ref: string; _weak?: boolean };
  projectSlug: string;
  backlinks: Array<{
    _key: string;
    platform: string;
    url: string;
  }>;
}

/**
 * Builds a complete Project document payload for automated creation.
 * Sets hidden: true so the project and its devlogs are published in Sanity Lake
 * (preventing referential integrity errors) but hidden from the public portfolio
 * until human developer review.
 */
export function buildProjectPayload(
  config: ValidatedPortfolioConfig,
  targetRepo?: string,
  initialDescription?: string
): SanityProjectDocument {
  const shortDesc = (config.note || initialDescription || `Autonomous engineering project: ${config.projectTitle}`).slice(
    0,
    280
  );

  return {
    _id: `project-${config.projectSlug}`,
    _type: 'project',
    title: config.projectTitle,
    slug: { _type: 'slug', current: config.projectSlug },
    projectType: config.category || 'Engineering',
    shortDescription: shortDesc,
    status: 'development',
    author: 'Agentic Writer',
    priorityValue: 0,
    featured: false,
    hidden: true, // Human Review Gate: published to Lake for referential integrity, hidden from public UI
    ...(config.liveUrl ? { website: config.liveUrl } : {}),
    ...(targetRepo ? { repository: `https://github.com/${targetRepo}` } : {}),
    techStacks: [],
    collaborators: [],
    media: [],
    content: [
      {
        _key: 'intro-block',
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: 'intro-span',
            _type: 'span',
            text: shortDesc,
            marks: [],
          },
        ],
      },
    ],
  };
}

/**
 * Builds a complete WorkLog document payload for automated creation.
 * Strongly binds to project-${config.projectSlug} and writes denormalized projectSlug.
 */
export function buildWorkLogPayload(
  config: ValidatedPortfolioConfig,
  commitSha: string,
  synthesis: DevLogSynthesisResult,
  contentBlocks: unknown[],
  sender = 'Developer',
  targetRepo = ''
): SanityWorkLogDocument {
  const cleanSha = commitSha.slice(0, 10);
  const today = new Date().toISOString().split('T')[0];

  // Verify and normalize badge to schema enum
  const validBadge: ValidBadge = (VALID_BADGES as readonly string[]).includes(synthesis.badge)
    ? (synthesis.badge as ValidBadge)
    : 'Feature';

  return {
    _id: `devlog-${config.projectSlug}-${cleanSha}`,
    _type: 'workLog',
    title: synthesis.title,
    badge: validBadge,
    date: today,
    description: synthesis.description,
    commitSha: commitSha,
    author: 'Agentic Writer',
    developers: [sender, 'Agentic Writer'],
    content: contentBlocks,
    project: {
      _type: 'reference',
      _ref: `project-${config.projectSlug}`,
    },
    projectSlug: config.projectSlug, // Denormalized anchor for fail-safe GROQ indexing
    backlinks: targetRepo
      ? [
          {
            _key: 'bl-gh',
            platform: 'GitHub',
            url: `https://github.com/${targetRepo}/commit/${commitSha}`,
          },
        ]
      : [],
  };
}

