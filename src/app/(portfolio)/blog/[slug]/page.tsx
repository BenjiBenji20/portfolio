import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getProjectBySlug,
  getAllProjects,
  getArticlesByProjectSlug,
  getWorkLogsByProjectSlug,
} from '@/data/fallbackData';
import { ProjectPreview } from '@/components/ui/ProjectPreview';
import { ProjectBlogTabs } from '@/components/blog/ProjectBlogTabs';
import { TabNavRightSidebar } from '@/components/ui/TabNavRightSidebar';
import { BackButton } from '@/components/ui/BackButton';

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Blog Post Not Found | Benjineer Portfolio',
    };
  }

  return {
    title: `${project.title} | Benjineer Blog`,
    description: project.shortDescription || `Blog details for ${project.title}`,
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

function BlogDetailSkeleton() {
  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10 animate-pulse">
      <div className="flex-1 min-w-0 space-y-8">
        {/* Top back navigation skeleton */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <BackButton fallbackHref="/blog" fallbackLabel="Back to Blog" />
          <div className="h-5 w-24 bg-zinc-900 border border-zinc-800 rounded" />
        </div>

        {/* Main Container Skeleton */}
        <div className="space-y-6">
          <div className="w-full aspect-[16/9] border border-zinc-800/80 bg-zinc-900/60 rounded" />

          <div className="space-y-4">
            <div className="h-8 w-64 bg-zinc-800 rounded" />
            <div className="space-y-2 max-w-3xl">
              <div className="h-4 w-full bg-zinc-900 rounded" />
              <div className="h-4 w-5/6 bg-zinc-900 rounded" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="h-8 w-28 bg-zinc-900 border border-zinc-800 rounded" />
              <div className="h-8 w-36 bg-zinc-900 border border-zinc-800 rounded" />
            </div>

            <div className="pt-4 border-t border-zinc-800/60 space-y-2">
              <div className="h-3 w-20 bg-zinc-900 rounded" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-zinc-900 border border-zinc-800 rounded" />
                <div className="h-6 w-20 bg-zinc-900 border border-zinc-800 rounded" />
                <div className="h-6 w-14 bg-zinc-900 border border-zinc-800 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Grid Skeleton */}
        <div className="space-y-6 pt-4">
          <div className="flex gap-4 border-b border-zinc-800/80 pb-2">
            <div className="h-6 w-24 bg-zinc-900 rounded" />
            <div className="h-6 w-24 bg-zinc-900 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-64 bg-zinc-900/60 border border-zinc-800 rounded" />
            <div className="h-64 bg-zinc-900/60 border border-zinc-800 rounded" />
          </div>
        </div>
      </div>

      {/* Right Sidebar Skeleton */}
      <aside className="hidden md:block w-56 lg:w-64 shrink-0">
        <div className="bg-zinc-950/60 p-4 space-y-3 border border-zinc-800/60">
          <div className="h-4 w-28 bg-zinc-900 rounded" />
          <div className="h-5 w-full bg-zinc-900/40 rounded" />
          <div className="h-5 w-full bg-zinc-900/40 rounded" />
          <div className="h-5 w-3/4 bg-zinc-900/40 rounded" />
        </div>
      </aside>
    </div>
  );
}

async function BlogDetailContent({
  params,
}: BlogDetailPageProps) {
  const { slug } = await params;
  const [project, allProjects, articles, workLogs] = await Promise.all([
    getProjectBySlug(slug),
    getAllProjects(),
    getArticlesByProjectSlug(slug),
    getWorkLogsByProjectSlug(slug),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-8 animate-in fade-in duration-200">
        {/* Project Preview with Image 2 updated layout */}
        <ProjectPreview
          project={project}
          backHref="/blog"
          backLabel="Back to Blog"
        />

        {/* Top Tab Bar: Articles (default) & Work Log with 2x2 Blog Items Grid */}
        <div className="pt-6 border-t border-zinc-800/80">
          <ProjectBlogTabs
            projectSlug={slug}
            projectTitle={project.title}
            articles={articles}
            workLogs={workLogs}
            repositoryUrl={project.repository}
          />
        </div>
      </div>

      {/* Right side: TabNavRightSidebar */}
      <TabNavRightSidebar
        title="Project Blogs"
        emptyText="No Project Blogs Found"
        projects={allProjects}
        route="/blog"
      />
    </div>
  );
}

export default function BlogDetailPage({
  params,
}: BlogDetailPageProps) {
  return (
    <Suspense fallback={<BlogDetailSkeleton />}>
      <BlogDetailContent params={params} />
    </Suspense>
  );
}

