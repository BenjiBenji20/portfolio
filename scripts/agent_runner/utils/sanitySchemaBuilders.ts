import type {
  ValidatedPortfolioConfig,
  DevLogSynthesisResult,
  ArticleSynthesisResult,
  ArticlePatchResult,
  ArticleSection,
} from '../types';
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

export interface SanityArticleDocument {
  _id: string;
  _type: 'article';
  title: string;
  slug: { _type: 'slug'; current: string };
  project: { _type: 'reference'; _ref: string; _weak: true };
  excerpt: string;
  publishedAt: string;
  readTime: string;
  priorityValue: number;
  author: 'Agentic Writer';
  developers: string[];
  hidden: boolean;
  content: unknown[];
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

/**
 * Transforms structured article sections into Sanity Portable Text blocks.
 */
export function convertArticleSectionsToBlocks(
  sections: ArticleSection[],
  includeMermaid = true,
  takeaways?: string[]
): unknown[] {
  const blocks: unknown[] = [];

  sections.forEach((sec, idx) => {
    // 1. Heading block (h2)
    blocks.push({
      _key: `sec-h-${idx}`,
      _type: 'block',
      style: 'h2',
      children: [
        {
          _key: `span-h-${idx}`,
          _type: 'span',
          text: sec.heading,
          marks: [],
        },
      ],
    });

    // 2. Narrative paragraphs
    const paragraphs = sec.body.split(/\n\n+/).filter((p) => p.trim().length > 0);
    paragraphs.forEach((p, pIdx) => {
      blocks.push({
        _key: `sec-p-${idx}-${pIdx}`,
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: `span-p-${idx}-${pIdx}`,
            _type: 'span',
            text: p.trim(),
            marks: [],
          },
        ],
      });
    });

    // 3. Code snippet block
    if (sec.codeSnippet && sec.codeSnippet.code) {
      const codeText = sec.codeSnippet.filename
        ? `// ${sec.codeSnippet.filename}\n${sec.codeSnippet.code}`
        : sec.codeSnippet.code;

      blocks.push({
        _key: `sec-code-${idx}`,
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: `span-code-${idx}`,
            _type: 'span',
            text: codeText,
            marks: ['code'],
          },
        ],
      });
    }

    // 4. Mermaid Diagram block
    if (includeMermaid && sec.mermaidDiagram) {
      blocks.push({
        _key: `sec-mm-head-${idx}`,
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: `span-mm-head-${idx}`,
            _type: 'span',
            text: 'Architecture Diagram:',
            marks: ['strong'],
          },
        ],
      });
      blocks.push({
        _key: `sec-mm-diag-${idx}`,
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: `span-mm-diag-${idx}`,
            _type: 'span',
            text: sec.mermaidDiagram,
            marks: [],
          },
        ],
      });
    }
  });

  // 5. Takeaways bullet list (if present)
  if (takeaways && takeaways.length > 0) {
    blocks.push({
      _key: 'takeaways-heading',
      _type: 'block',
      style: 'h2',
      children: [
        {
          _key: 'tw-h-span',
          _type: 'span',
          text: 'Key Architectural Takeaways',
          marks: [],
        },
      ],
    });
    takeaways.forEach((tw, twIdx) => {
      blocks.push({
        _key: `tw-${twIdx}`,
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        children: [
          {
            _key: `tw-span-${twIdx}`,
            _type: 'span',
            text: tw,
            marks: [],
          },
        ],
      });
    });
  }

  return blocks;
}

/**
 * Builds a publication-ready Sanity Article document staged strictly as a DRAFT.
 * Sets hidden: true to enforce the human editorial review gate.
 */
export function buildArticleDraftPayload(
  config: ValidatedPortfolioConfig,
  synthesis: ArticleSynthesisResult,
  sender = 'Developer',
  projectIdRef?: string
): SanityArticleDocument {
  const projectSlug =
    config.projectSlug ||
    (config.projectTitle
      ? config.projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'engineering-project');
  const articleSlug =
    synthesis.slug ||
    synthesis.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const publishedAt = new Date().toISOString();

  const includeMermaid = config.mediaPreferences?.generateArchitectureDiagrams !== false;
  const contentBlocks = convertArticleSectionsToBlocks(
    synthesis.sections,
    includeMermaid,
    synthesis.takeaways
  );

  return {
    _id: `drafts.article-${projectSlug}-${articleSlug}`,
    _type: 'article',
    title: synthesis.title,
    slug: { _type: 'slug', current: articleSlug },
    project: {
      _type: 'reference',
      _ref: projectIdRef || `project-${projectSlug}`,
      _weak: true,
    },
    excerpt: synthesis.excerpt.slice(0, 300),
    publishedAt,
    readTime: synthesis.readTime || '5 min read',
    priorityValue: synthesis.priorityValue ?? 0,
    author: 'Agentic Writer',
    developers: [sender, 'Agentic Writer'],
    hidden: true, // Strict Human Review Gate: All AI-authored articles are hidden drafts
    content: contentBlocks,
  };
}

/**
 * Builds Portable Text blocks representing an architectural addendum for updating an existing article.
 */
export function buildArticlePatchBlocks(
  patch: ArticlePatchResult,
  includeMermaid = true
): unknown[] {
  const now = Date.now();
  const blocks: unknown[] = [
    {
      _key: `addendum-h-${now}`,
      _type: 'block',
      style: 'h2',
      children: [
        {
          _key: `addendum-h-span-${now}`,
          _type: 'span',
          text: patch.addendumTitle,
          marks: ['strong'],
        },
      ],
    },
    {
      _key: `addendum-sum-${now}`,
      _type: 'block',
      style: 'normal',
      children: [
        {
          _key: `addendum-sum-span-${now}`,
          _type: 'span',
          text: patch.summary,
          marks: ['em'],
        },
      ],
    },
    ...convertArticleSectionsToBlocks(patch.sections, includeMermaid),
  ];

  return blocks;
}


