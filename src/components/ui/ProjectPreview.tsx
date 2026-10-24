'use client';

import { useMemo } from 'react';
import {
  FiCalendar,
  FiUser,
  FiUsers,
  FiBriefcase,
  FiGlobe,
  FiGithub,
} from 'react-icons/fi';
import type { ProjectData } from '@/types/sanity';
import { ProjectMediaCarousel } from '@/components/projects/ProjectMediaCarousel';
import { BackButton } from '@/components/ui/BackButton';

export interface ProjectPreviewProps {
  project: ProjectData;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function ProjectPreview({
  project,
  backHref,
  backLabel,
  className = '',
}: ProjectPreviewProps) {
  const formattedDateRange = useMemo(() => {
    if (!project.dateStarted && !project.dateFinished) return null;

    const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return isNaN(d.getTime())
          ? dateStr
          : d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };

    if (project.dateStarted && project.dateFinished) {
      return `${formatDate(project.dateStarted)} — ${formatDate(project.dateFinished)}`;
    }
    if (project.dateStarted) {
      return project.status === 'development'
        ? `${formatDate(project.dateStarted)} — Present`
        : formatDate(project.dateStarted);
    }
    return formatDate(project.dateFinished!);
  }, [project.dateStarted, project.dateFinished, project.status]);

  const collaboratorsText = useMemo(() => {
    if (project.collaborators && project.collaborators.length > 0) {
      return project.collaborators.map((c) => c.name).join(', ');
    }
    return null;
  }, [project.collaborators]);

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Top Back Navigation */}
      {backHref && (
        <div className="border-b border-zinc-800/80 pb-4">
          <BackButton fallbackHref={backHref} fallbackLabel={backLabel || 'Back'} />
        </div>
      )}

      {/* Top Metadata Row (Placed right above the media banner) */}
      <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-mono text-zinc-400 flex-wrap">
        {formattedDateRange && (
          <span className="flex items-center gap-1.5">
            <FiCalendar className="w-3.5 h-3.5 text-zinc-500" />
            {formattedDateRange}
          </span>
        )}

        {/* Pushes projectType and status to the right end of this line */}
        {(project.projectType || project.status) && (
          <div className="ml-auto flex items-center gap-2">
            {project.projectType && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-sky-400 bg-sky-950/40 px-2 py-0.5 border border-sky-800/40">
                {project.projectType}
              </span>
            )}

            {project.status && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-800/40">
                {project.status}
              </span>
            )}
          </div>
        )}

        {/* Media Carousel (breaks to its own line due to w-full) */}
        {project.media && project.media.length > 0 && (
          <div className="w-full overflow-hidden border border-zinc-800/80 bg-zinc-950/60 shadow-xl">
            <ProjectMediaCarousel
              media={project.media}
              title={project.title}
              aspectClass="aspect-[16/9]"
            />
          </div>
        )}
      </div>

      {/* Project Header & Metadata */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100">
          {project.title}
        </h1>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-mono text-zinc-400 flex-wrap">

          {collaboratorsText && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
              <FiUsers className="w-3 h-3 text-zinc-500" />
              <span>By: {collaboratorsText}</span>
            </span>
          )}

          {project.organization && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
              <FiBriefcase className="w-3 h-3 text-zinc-500" />
              <span>{project.organization}</span>
            </span>
          )}

          {!project.organization && project.employer && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
              <FiBriefcase className="w-3 h-3 text-zinc-500" />
              <span>Client: {project.employer}</span>
            </span>
          )}
        </div>

        {project.shortDescription && (
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
            {project.shortDescription}
          </p>
        )}

        {/* Action Links */}
        {(project.website || project.repository) && (
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 bg-zinc-900 text-zinc-200 hover:text-white border border-zinc-700 hover:border-sky-500/50 transition-colors"
              >
                <FiGlobe className="w-3.5 h-3.5 text-sky-400" />
                <span>Live Website</span>
              </a>
            )}
            {project.repository && (
              <a
                href={project.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 bg-zinc-900 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors"
              >
                <FiGithub className="w-3.5 h-3.5 text-zinc-400" />
                <span>Source Repository</span>
              </a>
            )}
          </div>
        )}

        {/* Tech Stacks */}
        {project.techStacks && project.techStacks.length > 0 && (
          <div className="pt-4 border-t border-zinc-800/60">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block mb-2">
              Technologies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {project.techStacks.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-xs px-2 py-0.5 bg-zinc-900/80 text-zinc-300 border border-zinc-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
