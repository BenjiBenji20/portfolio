export function BlogSkeleton() {
  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10 animate-pulse">
      {/* ========================================================= */}
      {/* LEFT / MAIN COLUMN: Article Narrative Skeleton            */}
      {/* ========================================================= */}
      <article className="flex-1 min-w-0 w-full space-y-8">
        {/* Header Metadata & Title */}
        <header className="border-b border-zinc-800/80 pb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 bg-zinc-900 rounded-none" />
            <div className="h-4 w-16 bg-zinc-900 rounded-none" />
          </div>
          <div className="space-y-2">
            <div className="h-8 sm:h-9 md:h-10 w-4/5 bg-zinc-900 rounded-none" />
            <div className="h-8 sm:h-9 md:h-10 w-1/2 bg-zinc-900/70 rounded-none" />
          </div>
        </header>

        {/* Narrative Paragraphs */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-zinc-900/60 rounded-none" />
          <div className="h-4 w-[92%] bg-zinc-900/60 rounded-none" />
          <div className="h-4 w-[85%] bg-zinc-900/60 rounded-none" />
          <div className="h-4 w-[65%] bg-zinc-900/60 rounded-none" />
        </div>

        {/* Media / Visual Showcase Placeholder */}
        <div className="w-full aspect-[16/9] bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-center">
          <div className="w-12 h-12 bg-zinc-850/60 border border-zinc-800/60 flex items-center justify-center">
            <div className="w-4 h-4 bg-zinc-700/50 rounded-none" />
          </div>
        </div>

        {/* Subheading & Paragraph */}
        <div className="space-y-3 pt-2">
          <div className="h-6 w-1/3 bg-zinc-900 rounded-none mb-4" />
          <div className="h-4 w-full bg-zinc-900/60 rounded-none" />
          <div className="h-4 w-[88%] bg-zinc-900/60 rounded-none" />
          <div className="h-4 w-[75%] bg-zinc-900/60 rounded-none" />
        </div>

        {/* Code Block Placeholder */}
        <div className="w-full h-36 bg-zinc-950/80 border border-zinc-800/50 p-4 space-y-2.5">
          <div className="h-3 w-32 bg-zinc-800/60 rounded-none" />
          <div className="h-3 w-4/5 bg-zinc-900/80 rounded-none" />
          <div className="h-3 w-3/5 bg-zinc-900/80 rounded-none" />
          <div className="h-3 w-2/3 bg-zinc-900/80 rounded-none" />
        </div>
      </article>

      {/* ========================================================= */}
      {/* RIGHT SIDE: Table of Contents / Projects Sidebar Skeleton  */}
      {/* Note: strictly NO border on the container                 */}
      {/* ========================================================= */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4">
        <div className="bg-zinc-950/60 backdrop-blur-sm p-4 space-y-3">
          <div className="h-4 w-20 bg-zinc-900 rounded-none" />
          <div className="space-y-2 pt-2">
            <div className="h-7 w-full bg-zinc-900/40 rounded-none" />
            <div className="h-7 w-full bg-zinc-900/40 rounded-none" />
            <div className="h-7 w-3/4 bg-zinc-900/40 rounded-none" />
          </div>
        </div>
      </aside>
    </div>
  );
}
