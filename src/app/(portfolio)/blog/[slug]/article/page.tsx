import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { getProjectBySlug, getAllProjects } from '@/data/fallbackData';
import { BackButton } from '@/components/ui/BackButton';
import { TabNavRightSidebar, type TabNavItem } from '@/components/ui/TabNavRightSidebar';

interface BlogArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Article Not Found | Benjineer Blog',
    };
  }

  return {
    title: `${project.title}: Deep Dive | Benjineer Blog`,
    description: `Full technical architecture case study and engineering breakdown for ${project.title}.`,
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

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Section navigation anchors for TabNavRightSidebar
  const articleSections: TabNavItem[] = [
    {
      id: 'sec-overview',
      label: 'Executive Overview',
      href: '#sec-overview',
    },
    {
      id: 'sec-architecture',
      label: 'Topology & System Design',
      href: '#sec-architecture',
    },
    {
      id: 'sec-vector-isolation',
      label: 'Vector Ingestion Pipeline',
      href: '#sec-vector-isolation',
    },
    {
      id: 'sec-benchmarks',
      label: 'Benchmarks & Latency',
      href: '#sec-benchmarks',
    },
    {
      id: 'sec-takeaways',
      label: 'Key Engineering Takeaways',
      href: '#sec-takeaways',
    },
  ];

  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10">
      {/* ========================================================= */}
      {/* MAIN ARTICLE BODY                                         */}
      {/* ========================================================= */}
      <article className="flex-1 min-w-0 space-y-8 animate-in fade-in duration-200">
        {/* Top back navigation */}
        <div className="border-b border-zinc-800/80 pb-4">
          <BackButton
            fallbackHref={`/blog/${slug}`}
            fallbackLabel={`Back to ${project.title} Blog`}
          />
        </div>

        {/* Article Header */}
        <header className="space-y-3 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5 text-zinc-500" />
              Oct 20, 2026
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5 text-zinc-500" />
              6 min read
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100">
            {project.title}: Production Architecture & System Design
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
            {project.shortDescription ||
              'A granular retrospective detailing the architectural decisions, token economics, and async document orchestration patterns.'}
          </p>
        </header>

        {/* Article Sections (Targeted by TabNavRightSidebar via #hash) */}
        <div className="space-y-10 text-sm sm:text-base text-zinc-300 leading-relaxed font-sans">
          {/* Section 1 */}
          <section id="sec-overview" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Executive Overview</span>
            </h2>
            <p>
              When designing {project.title}, our primary mandate was balancing strict tenant
              isolation with predictable p99 inference latency. Traditional multi-tenant deployments
              frequently encounter resource starvation under heavy ingestion spikes.
            </p>
            <p>
              By decoupling ingestion from retrieval and implementing constant-time payload
              lookups, we achieved sub-50ms latency across multi-thousand chunk datasets.
            </p>
          </section>

          {/* Section 2 */}
          <section id="sec-architecture" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Topology & System Design</span>
            </h2>
            <p>
              The system operates on an asynchronous event-driven topology. Incoming document
              payloads undergo validation via cryptographic HMAC verification before entering a
              Google Cloud Tasks worker pool.
            </p>
            <div className="p-4 bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1">
              <div className="text-zinc-500">// Architecture Pipeline:</div>
              <div className="text-sky-300">Client Request → Next.js Edge → HMAC Intake → Cloud Tasks Queue → Qdrant Vector Pool</div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="sec-vector-isolation" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Vector Ingestion Pipeline</span>
            </h2>
            <p>
              Rather than maintaining thousands of small individual collections, payload schemas
              partition a unified collection. This design drastically reduces RAM overhead while
              preserving hard cryptographic boundary guarantees.
            </p>
            {project.techStacks && project.techStacks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStacks.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-xs px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Section 4 */}
          <section id="sec-benchmarks" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Benchmarks & Latency</span>
            </h2>
            <p>
              Benchmarking performed under high concurrent load showed sustained throughput of
              over 450 requests per second with zero payload cross-bleeding.
            </p>
          </section>

          {/* Section 5 */}
          <section id="sec-takeaways" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Key Engineering Takeaways</span>
            </h2>
            <p>
              Modular architecture and early boundary definition were the cornerstones of
              delivering a robust, scalable system that stands up to production rigor.
            </p>
          </section>
        </div>
      </article>

      {/* ========================================================= */}
      {/* RIGHT SIDEBAR: Table of Contents (Section Navigation)     */}
      {/* ========================================================= */}
      <TabNavRightSidebar
        title="Table of Contents"
        items={articleSections}
        emptyText="No sections found"
      />
    </div>
  );
}
