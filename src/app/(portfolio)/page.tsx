import Link from 'next/link';
import { FiArrowUpRight, FiTerminal, FiCpu, FiShield } from 'react-icons/fi';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Overview & Mission */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <span>Overview</span>
        </h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Junior Backend Developer with hands-on experience architecting production-ready{' '}
          <strong className="text-zinc-100 font-semibold">RAG systems</strong>, full-stack web applications, and performing technical security assessments. Focused on scalable APIs, vector database partitioning, and autonomous agent workflows.
        </p>

        {/* Focus Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <FiTerminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>RAG Pipelines</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-normal">
              Multi-LLM token budgeting, Qdrant multi-tenant vector isolation, and cloud task workers.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <FiCpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backend Architecture</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-normal">
              High-throughput FastAPI endpoints, PostgreSQL data modeling, and GCS signed URL pipelines.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <FiShield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security & Auditing</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-normal">
              Black-box UI security testing, session vulnerability uncovering, and technical advisory reports.
            </p>
          </div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            Experience & Roles
          </h2>
          <span className="text-xs text-zinc-500 font-mono">2025 — Present</span>
        </div>

        <div className="space-y-4 border-l border-zinc-800/80 pl-4 sm:pl-6 ml-2">
          {/* Role 1 */}
          <div className="relative group">
            <span className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-zinc-950" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h3 className="text-sm font-semibold text-zinc-100">
                Freelance Software Engineer
                <span className="text-zinc-400 font-normal"> · Casamento Events Management</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500">Sep 2026 — Present</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Engineered and deployed a headless-CMS marketing website and admin booking/payment tracking portal using Next.js, Supabase, Sanity CMS, and Vercel.
            </p>
          </div>

          {/* Role 2 */}
          <div className="relative group">
            <span className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-700 ring-4 ring-zinc-950" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h3 className="text-sm font-semibold text-zinc-100">
                IT Programmer / IT Admin
                <span className="text-zinc-400 font-normal"> · Continental Sales Inc.</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500">Jun 2026 — Sep 2026</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Conducted black-box UI security testing on ERP systems uncovering session management flaws; delivered executive technical risk audits; engineered serverless HR applicant evaluation portal.
            </p>
          </div>

          {/* Role 3 */}
          <div className="relative group">
            <span className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-700 ring-4 ring-zinc-950" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h3 className="text-sm font-semibold text-zinc-100">
                Software Developer Intern
                <span className="text-zinc-400 font-normal"> · Colour Variant Multimedia Services</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500">Feb 2026 — Apr 2026</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Developed and deployed an automated 24/7 business chatbot integrating Python FastAPI and ChromaDB vector search with React and GCP infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Projects Teaser */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            Featured Systems
          </h2>
          <Link
            href="/projects"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>View all projects</span>
            <FiArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">IntelliChat (SaaS RAG System)</span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                Production
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Production RAG orchestration with token budgeting, Google Cloud Tasks async document worker, and multi-tenant vector isolation in Qdrant.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['FastAPI', 'Qdrant', 'Cloud Tasks', 'GCS', 'Gemini'].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">
                Smart Traffic Monitoring & Analytics
              </span>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded">
                Edge AI
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              YOLOv8 vehicle detection pipeline on Raspberry Pi Zero 2 W with FB Prophet time-series congestion forecasting for Malabon LGU.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['Python', 'YOLOv8', 'FB Prophet', 'RPi', 'Edge AI'].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
