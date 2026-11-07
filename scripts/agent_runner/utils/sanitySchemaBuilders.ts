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
  dateStarted?: string;
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
  project: { _type: 'reference'; _ref: string; _weak: true };
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
  initialDescription?: string,
  synthesizedTechStacks: string[] = []
): SanityProjectDocument {
  const projectTitle = config.projectTitle || (targetRepo ? targetRepo.split('/')[1] : 'Engineering Project');
  const projectSlug = config.projectSlug || projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const rawDesc =
    initialDescription ||
    config.developerDirective ||
    config.userMessage ||
    config.projectOverview ||
    config.note ||
    `Autonomous engineering project: ${projectTitle}`;
  const shortDesc = rawDesc.slice(0, 280);

  return {
    _id: `project-${projectSlug}`,
    _type: 'project',
    title: projectTitle,
    slug: { _type: 'slug', current: projectSlug },
    projectType: config.category || 'Engineering',
    shortDescription: shortDesc,
    status: 'development',
    author: 'Agentic Writer',
    priorityValue: 0,
    featured: false,
    hidden: true, // Human Review Gate: published to Lake for referential integrity, hidden from public UI
    dateStarted: new Date().toISOString().split('T')[0],
    ...(config.liveUrl ? { website: config.liveUrl } : {}),
    ...(targetRepo ? { repository: `https://github.com/${targetRepo}` } : {}),
    techStacks: synthesizedTechStacks,
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
            text: rawDesc, // Full untruncated narrative in Portable Text
            marks: [],
          },
        ],
      },
    ],
  };
}

/**
 * Builds a complete WorkLog document payload for automated creation.
 * Sets _weak: true to conform strictly to Sanity schema weak reference.
 */
export function buildWorkLogPayload(
  config: ValidatedPortfolioConfig,
  commitSha: string,
  synthesis: DevLogSynthesisResult,
  contentBlocks: unknown[],
  sender = 'Developer',
  targetRepo = '',
  projectIdRef?: string
): SanityWorkLogDocument {
  const cleanSha = commitSha.slice(0, 10);
  const today = new Date().toISOString().split('T')[0];
  const projectSlug = config.projectSlug || (config.projectTitle ? config.projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'engineering-project');

  // Verify and normalize badge to schema enum
  const validBadge: ValidBadge = (VALID_BADGES as readonly string[]).includes(synthesis.badge)
    ? (synthesis.badge as ValidBadge)
    : 'Feature';

  return {
    _id: `devlog-${projectSlug}-${cleanSha}`,
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
      _ref: projectIdRef || `project-${projectSlug}`,
      _weak: true,
    },
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

