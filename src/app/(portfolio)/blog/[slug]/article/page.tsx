import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllProjects, getArticleBySlugs } from '@/data/fallbackData';
import { ArticleContentClient } from '@/components/blog/ArticleContentClient';

interface BlogArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    article?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { article: articleSlug } = await searchParams;
  const [project, article] = await Promise.all([
    getProjectBySlug(slug),
    getArticleBySlugs(slug, articleSlug),
  ]);

  if (!project) {
    return {
      title: 'Article Not Found | Benjineer Blog',
    };
  }

  const title = article ? `${article.title} | ${project.title}` : `${project.title}: Deep Dive | Benjineer Blog`;
  const description =
    article?.excerpt ||
    project.shortDescription ||
    `Full technical architecture case study and engineering breakdown for ${project.title}.`;

  return {
    title,
    description,
  };
}

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project) => ({
    slug:
      typeof project.slug === 'string'
        ? project.slug
        : project.slug?.current || project._id,
  }));
}

export default async function BlogArticlePage({
  params,
  searchParams,
}: BlogArticlePageProps) {
  const { slug } = await params;
  const { article: articleSlug } = await searchParams;
  const [project, article] = await Promise.all([
    getProjectBySlug(slug),
    getArticleBySlugs(slug, articleSlug),
  ]);

  if (!project || !article) {
    notFound();
  }

  return (
    <ArticleContentClient
      article={article}
      project={project}
      projectSlug={slug}
    />
  );
}
