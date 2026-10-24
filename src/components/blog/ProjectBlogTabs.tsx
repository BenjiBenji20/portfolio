'use client';

import { useState } from 'react';
import { FiBookOpen, FiActivity, FiCheckCircle, FiClock } from 'react-icons/fi';
import { BlogItemCard, type BlogItem } from './BlogItemCard';

interface ProjectBlogTabsProps {
  projectSlug: string;
  projectTitle: string;
}

export function ProjectBlogTabs({
  projectSlug,
  projectTitle,
}: ProjectBlogTabsProps) {
  // Tab state: 'articles' (default) or 'worklog' (Dev Log)
  const [activeTab, setActiveTab] = useState<'articles' | 'worklog'>('articles');

  // Sample blog items for the 2x2 grid
  const sampleBlogItems: BlogItem[] = [
    {
      id: 'item-1',
      slug: 'rag-orchestration-architecture',
      title: `${projectTitle}: Architectural Deep Dive & Design Patterns`,
      excerpt:
        'A comprehensive exploration of multi-tenant isolation, token budgeting algorithms, and asynchronous ingestion worker queues in production.',
      publishedAt: 'Oct 20, 2026',
      readTime: '6 min read',
      imageUrl:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'item-2',
      slug: 'vector-partitioning-qdrant',
      title: 'Vector Partitioning & Payload Schemas in Qdrant',
      excerpt:
        'How payload filtering schemas prevented cross-tenant contamination while maintaining sub-millisecond similarity lookups.',
      publishedAt: 'Oct 14, 2026',
      readTime: '4 min read',
      imageUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'item-3',
      slug: 'hmac-security-revalidation',
      title: 'Cryptographic Webhook Intake & On-Demand Revalidation',
      excerpt:
        'Implementing cryptographic HMAC SHA-256 validation pipelines with cloud functions to securely filter non-essential payloads.',
      publishedAt: 'Oct 08, 2026',
      readTime: '5 min read',
      imageUrl:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'item-4',
      slug: 'evaluating-llm-latencies',
      title: 'Benchmarking Multi-LLM Latencies & Token Economics',
      excerpt:
        'Comparative study on latency trade-offs, fallback routing tiers, and cache hydration efficiency across production workloads.',
      publishedAt: 'Sep 29, 2026',
      readTime: '7 min read',
      imageUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Work Log / Dev Log entries
  const sampleWorkLogs = [
    {
      id: 'wl-1',
      date: 'Oct 23, 2026',
      badge: 'Production Release',
      title: 'PPR & Cache Components Integration',
      description:
        'Migrated layout boundaries to streaming Suspense shells for sub-50ms instant initial paint with Next.js 16 Partial Prefetching.',
    },
    {
      id: 'wl-2',
      date: 'Oct 18, 2026',
      badge: 'Optimization',
      title: 'Asynchronous Document Chunking Worker',
      description:
        'Offloaded vector embedding generation to background Google Cloud Tasks worker to prevent blocking HTTP handler timeouts.',
    },
    {
      id: 'wl-3',
      date: 'Oct 10, 2026',
      badge: 'Security',
      title: 'HMAC Webhook Intake & Rate Limiting',
      description:
        'Enforced constant-time HMAC SHA-256 signature verification and token-bucket rate limiting on all incoming deployment intake endpoints.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Tab Bar: Articles (Default) & Work Log (Dev Log) */}
      <div className="flex items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'articles'
                ? 'text-sky-400 font-bold border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <FiBookOpen className="w-3.5 h-3.5" />
            <span>Articles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('worklog')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'worklog'
                ? 'text-sky-400 font-bold border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <FiActivity className="w-3.5 h-3.5" />
            <span>Work Log</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline-block">
          {activeTab === 'articles' ? 'Curated Technical Articles' : 'Engineering Milestones'}
        </span>
      </div>

      {/* Main Body */}
      {activeTab === 'articles' ? (
        /* 2x2 Grid on Desktop & Tablet, 1x1 on Mobile */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {sampleBlogItems.map((item) => (
            <BlogItemCard
              key={item.id}
              item={item}
              projectSlug={projectSlug}
            />
          ))}
        </div>
      ) : (
        /* Work Log / Dev Log Timeline */
        <div className="space-y-4 border-l border-zinc-800/80 pl-4 sm:pl-6 ml-2 py-2">
          {sampleWorkLogs.map((log) => (
            <div key={log.id} className="relative space-y-1.5 group">
              <span className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-zinc-950" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <span>{log.title}</span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 border border-sky-800/40">
                    {log.badge}
                  </span>
                </h4>
                <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                  <FiClock className="w-3 h-3 text-zinc-500" />
                  {log.date}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                {log.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
