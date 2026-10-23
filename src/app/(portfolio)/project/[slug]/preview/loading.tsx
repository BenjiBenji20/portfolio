export default function ProjectPreviewLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Top back navigation skeleton */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="h-4 w-28 bg-zinc-900 rounded-none" />
        <div className="h-4 w-20 bg-zinc-900/60 border border-zinc-800/60 rounded-none" />
      </div>

      <div className="space-y-6">
        {/* Media Preview Box */}
        <div className="w-full aspect-[16/9] bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-center">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <div className="w-4 h-4 bg-zinc-700/40 rounded-none" />
          </div>
        </div>

        {/* Project Header & Metadata */}
        <div className="space-y-4">
          <div className="h-8 w-1/2 bg-zinc-900 rounded-none" />
          <div className="space-y-2 max-w-3xl">
            <div className="h-4 w-full bg-zinc-900/60 rounded-none" />
            <div className="h-4 w-4/5 bg-zinc-900/60 rounded-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="h-8 w-28 bg-zinc-900 border border-zinc-800 rounded-none" />
            <div className="h-8 w-36 bg-zinc-900 border border-zinc-800 rounded-none" />
          </div>

          <div className="pt-4 border-t border-zinc-800/60 space-y-2">
            <div className="h-3 w-20 bg-zinc-900/60 rounded-none" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-zinc-900 border border-zinc-800 rounded-none" />
              <div className="h-5 w-20 bg-zinc-900 border border-zinc-800 rounded-none" />
              <div className="h-5 w-14 bg-zinc-900 border border-zinc-800 rounded-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
