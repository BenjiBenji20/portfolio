'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiGithub, FiGlobe } from 'react-icons/fi';
import type { ProjectData } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';
import { ProjectMediaCarousel } from './ProjectMediaCarousel';

interface ProjectCardProps {
  project: ProjectData;
  aspectClass?: string;
  showMedia?: boolean;
  className?: string;
}

const DESCRIPTION_THRESHOLD = 110;

export function ProjectCard({
  project,
  aspectClass = 'aspect-[16/10]',
  showMedia = true,
  className = '',
}: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const slug =
    typeof project.slug === 'string'
      ? project.slug
      : project.slug?.current || project._id || '';

  const logoUrl = urlForImage(project.logo);
  const description = project.shortDescription || '';
  const isLongDescription = description.length > DESCRIPTION_THRESHOLD;

  return (
    <article
      className={`group relative w-full rounded-none overflow-hidden bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* 1. Landscape Media Carousel on Top (Excluded when showMedia is false) */}
      {showMedia && (
        <div className="relative w-full border-b border-zinc-800/60 shrink-0">
          <ProjectMediaCarousel
            media={project.media}
            title={project.title}
            aspectClass={aspectClass}
          />
        </div>
      )}

      {/* 2. Increased Card Content Body with Fixed Description Height (No card expansion) */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 min-h-[220px] sm:min-h-[235px]">
        <div>
          {/* Header: Logo Beside Title */}
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

          {/* Short Description with Strictly Locked Height (Zero card resize on Read more) */}
          {description && (
            <div
              className={`mt-2.5 h-16 text-xs leading-relaxed ${
                isExpanded
                  ? 'overflow-y-auto pr-1 text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700'
                  : 'overflow-hidden text-zinc-400'
              }`}
            >
              {!isLongDescription ? (
                <p>{description}</p>
              ) : !isExpanded ? (
                <p>
                  <span>{description.slice(0, DESCRIPTION_THRESHOLD)}... </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsExpanded(true);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-medium cursor-pointer transition-colors inline"
                  >
                    Read more...
                  </button>
                </p>
              ) : (
                <div>
                  <span>{description} </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsExpanded(false);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 text-[11px] font-medium cursor-pointer inline transition-colors"
                  >
                    (less)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Website and/or Repository Badges */}
          {(project.website || project.repository) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-zinc-800/60">
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

        {/* Action Footer: View Project -> */}
        <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-zinc-800/40">
          <Link
            href={`/project/${slug}/overview`}
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
