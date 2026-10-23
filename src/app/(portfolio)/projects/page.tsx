import { FiFolder, FiGitBranch, FiExternalLink } from 'react-icons/fi';

export default function ProjectsPage() {
  const projects = [
    {
      name: 'IntelliChat (SaaS RAG System)',
      status: 'Active',
      description:
        'Production-ready RAG system with multi-LLM support, Cloud Tasks asynchronous document workers, and Qdrant multi-tenant vector isolation.',
      tags: ['FastAPI', 'Qdrant', 'Cloud Tasks', 'GCS', 'Gemini'],
      github: 'https://github.com/BenjiBenji20',
    },
    {
      name: 'Smart Traffic Monitoring with Data Analytics',
      status: 'Completed',
      description:
        'Edge AI vehicle detection pipeline using YOLOv8 on Raspberry Pi Zero 2 W with FB Prophet time-series congestion forecasting for Malabon LGU.',
      tags: ['Python', 'YOLOv8', 'FB Prophet', 'RPi', 'Edge AI'],
      github: 'https://github.com/BenjiBenji20',
    },
    {
      name: 'Casamento Events Management Public & Admin Platform',
      status: 'Client Work',
      description:
        'Headless-CMS public marketing site and admin client management portal for event booking and payment tracking.',
      tags: ['Next.js', 'Sanity', 'Supabase', 'TypeScript', 'Vercel'],
      github: 'https://github.com/BenjiBenji20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Projects
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Tracked engineering repositories, architecture case studies, and systems.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
          {projects.length} Projects
        </span>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.name}
            className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiFolder className="w-4 h-4 text-sky-400 shrink-0" />
                <h3 className="text-sm font-semibold text-zinc-100 hover:text-sky-400 transition-colors">
                  {project.name}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                {project.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              {project.description}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-zinc-900">
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono transition-colors"
              >
                <FiGitBranch className="w-3 h-3" />
                <span>source</span>
                <FiExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
