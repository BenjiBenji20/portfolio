import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
import {
  getExperiences,
  getFeaturedProjects,
  getFocusPillars,
  getSummaryOverview,
} from '@/sanity/lib/client';
import { FocusPillars } from '@/components/home/FocusPillars';
import { ExperienceTimeline } from '@/components/home/ExperienceTimeline';
import { FeaturedProjectsGrid } from '@/components/home/FeaturedProjectsGrid';
import type { PortableTextParagraph } from '@/types/sanity';

function SummaryRenderer({ blocks }: { blocks?: PortableTextParagraph[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-sm text-zinc-300 leading-relaxed">
        Junior Backend Developer with hands-on experience architecting production-ready{' '}
        <strong className="text-zinc-100 font-semibold">RAG systems</strong>, full-stack web applications, and performing technical security assessments. Focused on scalable APIs, vector database partitioning, and autonomous agent workflows.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, bIdx) => (
        <p key={block._key || bIdx} className="text-sm text-zinc-300 leading-relaxed">
          {block.children?.map((child, cIdx) => {
            const isBold = child.marks?.includes('strong');
            if (isBold) {
              return (
                <strong key={child._key || cIdx} className="text-zinc-100 font-semibold">
                  {child.text}
                </strong>
              );
            }
            return <span key={child._key || cIdx}>{child.text}</span>;
          })}
        </p>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [summaryOverview, focusPillars, experiences, featuredProjects] =
    await Promise.all([
      getSummaryOverview(),
      getFocusPillars(),
      getExperiences(),
      getFeaturedProjects(),
    ]);

  return (
    <div className="space-y-10">
      {/* Overview & Mission */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <span>Overview</span>
        </h2>

        {/* Dynamic Summary with bold marks support (Singleton) */}
        <SummaryRenderer blocks={summaryOverview.summaryText} />

        {/* Dynamic Focus Pillars (100% circular icons array) */}
        <FocusPillars pillars={focusPillars} />
      </section>

      {/* Experience Timeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            Experience & Roles
          </h2>
          <span className="text-xs text-zinc-500 font-mono">2025 — Present</span>
        </div>

        {/* Dynamic Experience Timeline with Collapsible Accomplishments (Array) */}
        <ExperienceTimeline experiences={experiences} />
      </section>

      {/* Featured Projects Teaser */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            Featured Projects
          </h2>
          <Link
            href="/projects"
            className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <span>View all projects</span>
            <FiArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2x2 on Desktop/iPad, 1x1 on Mobile (showing 2 items) */}
        <FeaturedProjectsGrid projects={featuredProjects} />
      </section>
    </div>
  );
}
