import type { SanityClient } from 'next-sanity';
import type { AgenticToolDeclaration, ToolContext } from './toolRegistry';

export interface ProjectMilestoneItem {
  title: string;
  badge: string;
  date: string;
  description: string;
  commitSha?: string;
}

export interface ExistingArticleItem {
  title: string;
  slug: string;
  leadParagraph?: string;
}

export interface FullArticleData {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: unknown[];
  hidden?: boolean;
}

export interface ProjectHistoryDigest {
  recentWorkLogs: ProjectMilestoneItem[];
  existingArticles: ExistingArticleItem[];
}

/**
 * Extensible GROQ Tool: Sanity Project Milestone History Digest
 * 
 * Executes an ultra-compact (< 150 tokens) GROQ projection strictly isolated
 * to the target project. Gives the AI agent chronological memory of past milestones
 * and existing articles without multi-turn tool loops or token bloat.
 */
export async function fetchProjectHistoryDigest(
  client: SanityClient,
  projectSlug: string
): Promise<ProjectHistoryDigest> {
  if (!projectSlug) {
    return { recentWorkLogs: [], existingArticles: [] };
  }

  // Strict parameter binding enforces 100% project isolation
  const query = `{
    "recentWorkLogs": *[_type == "workLog" && (project->slug.current == $slug || projectSlug == $slug)] | order(date desc, _createdAt desc)[0..3] {
      title,
      badge,
      date,
      description,
      commitSha
    },
    "existingArticles": *[_type == "article" && (project->slug.current == $slug || projectSlug == $slug)] | order(_createdAt desc)[0..2] {
      title,
      "slug": slug.current,
      "leadParagraph": pt::text(content[0..1])
    }
  }`;

  try {
    const result = await client.fetch<ProjectHistoryDigest>(query, { slug: projectSlug });
    return {
      recentWorkLogs: Array.isArray(result?.recentWorkLogs) ? result.recentWorkLogs : [],
      existingArticles: Array.isArray(result?.existingArticles) ? result.existingArticles : [],
    };
  } catch (err) {
    console.warn(`[SanityGroqTool] History digest query failed for "${projectSlug}":`, err);
    return { recentWorkLogs: [], existingArticles: [] };
  }
}

/**
 * Extensible GROQ Tool: Retrieve Full Article by Slug for Patching & Context
 * 
 * Fetches an existing article's metadata and content blocks by its unique slug
 * so the AI agent can synthesize coherent, non-redundant architectural addendums.
 */
export async function fetchArticleBySlug(
  client: SanityClient,
  slug: string
): Promise<FullArticleData | null> {
  if (!slug) return null;

  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    content,
    hidden
  }`;

  try {
    const article = await client.fetch<FullArticleData | null>(query, { slug });
    return article || null;
  } catch (err) {
    console.warn(`[SanityGroqTool] fetchArticleBySlug failed for "${slug}":`, err);
    return null;
  }
}

/**
 * Standardized Agentic Tool Declaration: Project History Digest
 */
export const projectHistoryDigestTool: AgenticToolDeclaration<
  { projectSlug: string },
  ProjectHistoryDigest
> = {
  name: 'fetch_project_history_digest',
  description:
    'Queries Sanity Content Lake for recent project worklogs and published article metadata using an ultra-compact, project-isolated GROQ projection.',
  parameters: {
    type: 'object',
    properties: {
      projectSlug: {
        type: 'string',
        description: 'Target project slug for isolated history lookup',
      },
    },
    required: ['projectSlug'],
  },
  execute: async (args, context: ToolContext) => {
    const client = context.sanityClient;
    if (!client) {
      throw new Error('[SanityGroqTool] Execution failed: sanityClient missing in ToolContext');
    }
    const slug = args.projectSlug || context.projectSlug || '';
    return fetchProjectHistoryDigest(client, slug);
  },
};

/**
 * Standardized Agentic Tool Declaration: Article by Slug Lookup
 */
export const articleBySlugTool: AgenticToolDeclaration<
  { slug: string },
  FullArticleData | null
> = {
  name: 'fetch_article_by_slug',
  description:
    'Retrieves full article content blocks, excerpt, and metadata by unique slug from Sanity Content Lake for grounding or architectural patch synthesis.',
  parameters: {
    type: 'object',
    properties: {
      slug: {
        type: 'string',
        description: 'Unique URL slug of the article to retrieve',
      },
    },
    required: ['slug'],
  },
  execute: async (args, context: ToolContext) => {
    const client = context.sanityClient;
    if (!client) {
      throw new Error('[SanityGroqTool] Execution failed: sanityClient missing in ToolContext');
    }
    return fetchArticleBySlug(client, args.slug);
  },
};


