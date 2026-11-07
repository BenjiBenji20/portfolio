import type { SanityClient } from 'next-sanity';

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

