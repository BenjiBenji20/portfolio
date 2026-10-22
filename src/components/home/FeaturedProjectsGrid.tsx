import Link from 'next/link';
import { FiArrowUpRight, FiGithub, FiGlobe } from 'react-icons/fi';
import type { ProjectData } from '@/types/sanity';

interface FeaturedProjectsGridProps {
  projects: ProjectData[];
}

export function FeaturedProjectsGrid({ projects }: FeaturedProjectsGridProps) {
  const displayProjects = projects.slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {displayProjects.map((project, idx) => {
        const slug =
          typeof project.slug === 'string'
            ? project.slug
            : project.slug?.current || project._id;
        const isHiddenOnMobile = idx >= 2;

        return (
          <article
            key={project._id || slug || idx}
            className={`flex flex-col justify-between p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all ${
              isHiddenOnMobile ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div>
              {/* Header: Title */}
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/blogs/${slug}`}
                  className="group inline-flex items-center gap-1 text-sm font-semibold text-zinc-100 hover:text-sky-400 transition-colors"
                >
                  <span className="line-clamp-1">{project.title}</span>
                  <FiArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 transition-colors shrink-0" />
                </Link>
              </div>

              {/* Short Description */}
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3">
                {project.shortDescription}
              </p>
            </div>

            {/* Footer: Links (Website & Repository only) */}
            {(project.website || project.repository) && (
              <div className="flex items-center gap-3 pt-3 mt-3 border-t border-zinc-800/50">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-sky-400 transition-colors"
                    title="Live Website"
                  >
                    <FiGlobe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
                {project.repository && (
                  <a
                    href={project.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-sky-400 transition-colors"
                    title="Source Repository"
                  >
                    <FiGithub className="w-3.5 h-3.5" />
                    <span>Repository</span>
                  </a>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
