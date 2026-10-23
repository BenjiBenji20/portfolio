import type { ProjectData } from '@/types/sanity';
import { ProjectCard } from '@/components/projects/ProjectCard';

interface FeaturedProjectsGridProps {
  projects: ProjectData[];
}

export function FeaturedProjectsGrid({ projects }: FeaturedProjectsGridProps) {
  const displayProjects = projects.slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 items-start">
      {displayProjects.map((project, idx) => {
        const slug =
          typeof project.slug === 'string'
            ? project.slug
            : project.slug?.current || project._id || idx;
        const isHiddenOnMobile = idx >= 2;

        return (
          <div
            key={project._id || slug}
            className={isHiddenOnMobile ? 'hidden md:block' : 'block'}
          >
            <ProjectCard project={project} showMedia={false} />
          </div>
        );
      })}
    </div>
  );
}
