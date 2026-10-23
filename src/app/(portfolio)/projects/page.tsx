import type { Metadata } from 'next';
import { getAllProjects } from '@/sanity/lib/client';
import { ProjectsExplorer } from '@/components/projects/ProjectsExplorer';

export const metadata: Metadata = {
  title: 'Projects | Benjineer Portfolio',
  description:
    'Tracked engineering repositories, architecture case studies, and systems built by Benji I. Cañones.',
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="w-full space-y-6">
      {/* Header section with compact inline badge */}
      <div className="border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 uppercase">
            Projects
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-zinc-900 text-zinc-400 border border-zinc-800 whitespace-nowrap">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Tracked engineering repositories, architecture case studies, and systems.
        </p>
      </div>

      {/* Interactive Explorer: Search, Icon Filters & 2-Column Masonry */}
      <ProjectsExplorer initialProjects={projects} />
    </div>
  );
}
