'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiGithub, FiGlobe } from 'react-icons/fi';
import type { ProjectData } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';
import { ProjectMediaCarousel } from './ProjectMediaCarousel';

interface ProjectMasonryCardProps {
  project: ProjectData;
  aspectClass?: string;
}

export function ProjectMasonryCard({
  project,
  aspectClass = 'aspect-[16/10]',
}: ProjectMasonryCardProps) {
  const slug =
    typeof project.slug === 'string'
      ? project.slug
      : project.slug?.current || project._id || '';

  const logoUrl = urlForImage(project.logo);

  return (
    <article className="group relative w-full rounded-none overflow-hidden bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all shadow-sm flex flex-col justify-between">
      {/* Background Media / Carousel */}
      <div className="relative w-full border-b border-zinc-800/60">
        <ProjectMediaCarousel
          media={project.media}
          title={project.title}
          aspectClass={aspectClass}
        />
      </div>

      {/* Content Box - Clean flush card body without nested floating box or double padding */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
        <div>
          {/* Header: Logo (if available) Beside Title */}
          <div className="flex items-start gap-2.5">
            {logoUrl && (
              <div className="relative w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/80 overflow-hidden flex items-center justify-center p-0.5 mt-0.5">
                <Image
                  src={logoUrl}
                  alt={project.logo?.alt || `${project.title} logo`}
                  fill
                  sizes="28px"
                  className="object-contain rounded-none"
                  unoptimized
                />
              </div>
            )}
            <Link
              href={`/blogs/${slug}`}
              className="group/link flex-1 min-w-0"
            >
              <h3 className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-tight text-zinc-100 group-hover/link:text-sky-400 transition-colors line-clamp-1">
                {project.title}
              </h3>
            </Link>
          </div>

          {/* Short Description */}
          {project.shortDescription && (
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
              {project.shortDescription}
            </p>
          )}

          {/* Website and/or Repository Badges */}
          {(project.website || project.repository) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60">
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Visit Live Website"
                  className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-none bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors"
                >
                  <FiGlobe className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>Website</span>
                </a>
              )}
              {project.repository && (
                <a
                  href={project.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="View Source Repository"
                  className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-none bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors"
                >
                  <FiGithub className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>Repository</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action Link: View Project -> */}
        <div className="mt-3 pt-2 flex items-center justify-between border-t border-zinc-800/40">
          <Link
            href={`/blogs/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-sky-400 transition-all group/cta"
          >
            <span>View Project</span>
            <FiArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover/cta:text-sky-400 group-hover/cta:translate-x-1 transition-all" />
          </Link>
          {project.projectType && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {project.projectType}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
