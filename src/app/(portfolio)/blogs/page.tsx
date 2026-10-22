import { FiFileText, FiClock } from 'react-icons/fi';

export default function BlogsPage() {
  const blogs = [
    {
      title: 'Architecting Multi-Tenant Vector Database Scoping in Qdrant',
      date: '2026-03-15',
      readTime: '6 min read',
      excerpt:
        'A technical deep dive into isolating tenant namespaces using payload filters and per-chatbot collection scoping without sacrificing query latency.',
      tag: 'Architecture',
    },
    {
      title: 'Conducting Black-Box ERP UI Security Testing With Automation',
      date: '2026-07-20',
      readTime: '8 min read',
      excerpt:
        'How we identified session management flaws and unencrypted transmission vectors using browser dev tools and automated PowerShell audit pipelines.',
      tag: 'Security',
    },
    {
      title: 'Reducing FastAPI Memory Spikes With GCS Signed URL Direct Uploads',
      date: '2026-02-28',
      readTime: '5 min read',
      excerpt:
        'Eliminating server-side memory buffering for 50MB+ user documents by offloading uploads directly to Google Cloud Storage.',
      tag: 'Cloud & API',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Blogs & Notes
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Engineering writeups, architectural decisions, and technical walkthroughs.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
          {blogs.length} Articles
        </span>
      </div>

      <div className="space-y-3">
        {blogs.map((blog) => (
          <article
            key={blog.title}
            className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/40 text-sky-400 border border-sky-800/40">
                {blog.tag}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                <FiClock className="w-3 h-3" />
                <span>{blog.date}</span>
                <span>·</span>
                <span>{blog.readTime}</span>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 hover:text-sky-400 transition-colors mt-2 flex items-center gap-1.5">
              <FiFileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{blog.title}</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              {blog.excerpt}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
