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

export interface SanityProjectItem {
  title: string;
  slug: string;
  repository?: string;
  projectType?: string;
  shortDescription?: string;
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
 * If projectSlug is provided, sandboxes query to ensure the article belongs to the project.
 */
export async function fetchArticleBySlug(
  client: SanityClient,
  slug: string,
  projectSlug?: string
): Promise<FullArticleData | null> {
  if (!slug) return null;

  const query = projectSlug
    ? `*[_type == "article" && slug.current == $slug && (project->slug.current == $projectSlug || projectSlug == $projectSlug)][0] {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        content,
        hidden
      }`
    : `*[_type == "article" && slug.current == $slug][0] {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        content,
        hidden
      }`;

  try {
    const params: Record<string, string> = { slug };
    if (projectSlug) {
      params.projectSlug = projectSlug;
    }
    const article = await client.fetch<FullArticleData | null>(query, params);
    return article || null;
  } catch (err) {
    console.warn(`[SanityGroqTool] fetchArticleBySlug failed for "${slug}":`, err);
    return null;
  }
}

/**
 * Extensible GROQ Tool: List Registered Sanity Projects
 * 
 * Retrieves existing projects in Sanity Lake (title, slug, repo, category, description)
 * to allow autonomous project slug resolution when .portfolio.json is missing or mismatched.
 */
export async function fetchSanityProjects(
  client: SanityClient
): Promise<SanityProjectItem[]> {
  const query = `*[_type == "project"] | order(priorityValue desc, _createdAt desc) {
    title,
    "slug": slug.current,
    repository,
    projectType,
    shortDescription
  }`;

  try {
    const result = await client.fetch<SanityProjectItem[]>(query);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('[SanityGroqTool] fetchSanityProjects failed:', err);
    return [];
  }
}

/**
 * Standardized Agentic Tool Declaration: Project History Digest
 */
export const projectHistoryDigestTool: AgenticToolDeclaration<
  { projectSlug?: string },
  ProjectHistoryDigest
> = {
  name: 'fetch_project_history_digest',
  description:
    'Queries Sanity Content Lake for recent project worklogs and published article metadata using an ultra-compact, project-isolated GROQ projection.',
  scopes: ['triage', 'synthesis'],
  parameters: {
    type: 'object',
    properties: {
      projectSlug: {
        type: 'string',
        description: 'Target project slug for isolated history lookup (optional, defaults to active project scope)',
      },
    },
    required: [],
  },
  execute: async (args, context: ToolContext) => {
    const client = context.sanityClient;
    if (!client) {
      throw new Error('[SanityGroqTool] Execution failed: sanityClient missing in ToolContext');
    }
    const slug = context.projectSlug || args.projectSlug || '';
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
  scopes: ['triage', 'synthesis'],
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
    return fetchArticleBySlug(client, args.slug, context.projectSlug);
  },
};

/**
 * Standardized Agentic Tool Declaration: List Registered Projects
 */
export const sanityProjectsTool: AgenticToolDeclaration<
  Record<string, unknown>,
  SanityProjectItem[]
> = {
  name: 'fetch_sanity_projects',
  description:
    'Queries Sanity Content Lake for registered projects (title, slug, repository URL, category). Use to discover, verify, or resolve the canonical project slug if .portfolio.json slug is missing, changed, or ambiguous.',
  scopes: ['triage', 'synthesis'],
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  execute: async (_args, context: ToolContext) => {
    const client = context.sanityClient;
    if (!client) {
      throw new Error('[SanityGroqTool] Execution failed: sanityClient missing in ToolContext');
    }
    return fetchSanityProjects(client);
  },
};
