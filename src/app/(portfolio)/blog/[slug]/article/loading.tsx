export default function BlogArticleLoading() {
  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10 animate-pulse">
      <article className="flex-1 min-w-0 space-y-8">
        <div className="border-b border-zinc-800/80 pb-4">
          <div className="h-4 w-28 bg-zinc-900 rounded" />
        </div>
        <div className="space-y-3 pb-6 border-b border-zinc-800/80">
          <div className="h-4 w-44 bg-zinc-900 rounded" />
          <div className="h-8 w-3/4 bg-zinc-800 rounded" />
          <div className="h-4 w-full bg-zinc-900/60 rounded" />
        </div>
        <div className="space-y-6">
          <div className="h-6 w-48 bg-zinc-800 rounded" />
          <div className="h-4 w-full bg-zinc-900/50 rounded" />
          <div className="h-4 w-5/6 bg-zinc-900/50 rounded" />
        </div>
      </article>

      <aside className="hidden md:block w-56 lg:w-64 shrink-0">
        <div className="bg-zinc-950/60 p-4 space-y-3">
          <div className="h-4 w-28 bg-zinc-900 rounded" />
          <div className="h-5 w-full bg-zinc-900/40 rounded" />
          <div className="h-5 w-full bg-zinc-900/40 rounded" />
          <div className="h-5 w-3/4 bg-zinc-900/40 rounded" />
        </div>
      </aside>
    </div>
  );
}
