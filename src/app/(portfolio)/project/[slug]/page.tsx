import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProjectBySlug, getAllProjects } from '@/data/fallbackData';
import { BackButton } from '@/components/ui/BackButton';
import { ProjectDetailClient } from '@/components/projects/ProjectDetailClient';

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Project Not Found | Benjineer Portfolio',
    };
  }

  return {
    title: `${project.title} | Benjineer Portfolio`,
    description: project.shortDescription || `Project details for ${project.title}`,
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

function ProjectDetailSkeleton() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Top back navigation skeleton */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <BackButton fallbackHref="/projects" fallbackLabel="Back to Projects" />
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
    </div>
  );
}

async function ProjectDetailContent({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const [project, allProjects] = await Promise.all([
    getProjectBySlug(slug),
    getAllProjects(),
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} allProjects={allProjects} />;
}

export default function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailContent params={params} />
    </Suspense>
  );
}
