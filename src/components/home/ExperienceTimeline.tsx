'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import type { ExperienceItem } from '@/types/sanity';

interface ExperienceTimelineProps {
  experiences: ExperienceItem[];
}

export function ExperienceTimeline({ experiences }: ExperienceTimelineProps) {
  return (
    <div className="space-y-4 border-l border-zinc-800/80 pl-4 sm:pl-6 ml-2">
      {experiences.map((exp, index) => (
        <ExperienceNode key={exp._key || `${exp.employer}-${index}`} experience={exp} isFirst={index === 0} />
      ))}
    </div>
  );
}

function ExperienceNode({
  experience,
  isFirst,
}: {
  experience: ExperienceItem;
  isFirst: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAccomplishments =
    experience.accomplishments && experience.accomplishments.length > 0;

  return (
    <div className="relative group">
      {/* Node Dot */}
      <span
        className={`absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-zinc-950 transition-colors ${
          isFirst ? 'bg-sky-500' : 'bg-zinc-700'
        }`}
      />

      {/* Role Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h3 className="text-sm font-semibold text-zinc-100">
          {experience.position}
          <span className="text-zinc-400 font-normal"> · {experience.employer}</span>
        </h3>
        <span className="text-xs font-mono text-zinc-500 shrink-0">
          {experience.employmentRange}
        </span>
      </div>

      {/* Main Description */}
      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
        {experience.mainDescription}
      </p>

      {/* Collapsible Accomplishments */}
      {hasAccomplishments && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <FiChevronDown className="w-3 h-3" />
            ) : (
              <FiChevronRight className="w-3 h-3" />
            )}
            <span>
              {isOpen
                ? 'Hide accomplishments'
                : `Key accomplishments`}
            </span>
          </button>

          {isOpen && (
            <ul className="mt-2 space-y-1.5 pl-3 border-l border-zinc-800/80">
              {experience.accomplishments?.map((item, idx) => (
                <li
                  key={idx}
                  className="text-xs text-zinc-400 leading-relaxed flex items-start gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500/80 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
