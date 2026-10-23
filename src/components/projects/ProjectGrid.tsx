'use client';

import type { ProjectData } from '@/types/sanity';
import { ProjectCard } from './ProjectCard';
import { FiFolder } from 'react-icons/fi';

interface ProjectGridProps {
  projects: ProjectData[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="w-full py-16 px-4 border border-zinc-800/80 rounded-none bg-zinc-950/60 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <FiFolder className="w-5 h-5 stroke-1" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-zinc-200">
            No matching projects found
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm">
            Try adjusting your search query or change the active category, status, and stack filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    /* Desktop & iPad: 2x2 layout (md:grid-cols-2) | Mobile: 1x1 layout (grid-cols-1) */
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 items-start">
      {projects.map((project) => (
        <ProjectCard
          key={
            project._id ||
            (typeof project.slug === 'string' ? project.slug : project.slug?.current)
          }
          project={project}
          aspectClass="aspect-[16/10]"
          showMedia={true}
        />
      ))}
    </div>
  );
}
