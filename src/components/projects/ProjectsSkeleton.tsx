export function ProjectsSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header section skeleton */}
      <div className="border-b border-zinc-800/80 pb-4 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-28 bg-zinc-900 rounded-none" />
          <div className="h-5 w-20 bg-zinc-900/70 border border-zinc-800/60 rounded-none" />
        </div>
        <div className="h-3.5 w-72 sm:w-96 bg-zinc-900/50 rounded-none" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="space-y-3">
        {/* Search Input Placeholder */}
        <div className="w-full h-10 bg-zinc-900/50 border border-zinc-800/60 rounded-none" />

        {/* Filter Facets Placeholder */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <div className="h-6 w-16 bg-zinc-900/60 border border-zinc-800/50 rounded-none" />
          <div className="h-6 w-20 bg-zinc-900/40 border border-zinc-800/40 rounded-none" />
          <div className="h-6 w-24 bg-zinc-900/40 border border-zinc-800/40 rounded-none" />
          <div className="h-6 w-20 bg-zinc-900/40 border border-zinc-800/40 rounded-none" />
          <div className="h-6 w-28 bg-zinc-900/40 border border-zinc-800/40 rounded-none" />
        </div>
      </div>

      {/* 2-Column Project Grid Skeleton */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 items-start">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-none overflow-hidden space-y-4 pb-4"
          >
            {/* Media Aspect Ratio Placeholder */}
            <div className="w-full aspect-[16/10] bg-zinc-900/60 border-b border-zinc-800/60 flex items-center justify-center">
              <div className="w-10 h-10 bg-zinc-850/50 border border-zinc-800/50 flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-zinc-700/40 rounded-none" />
              </div>
            </div>

            {/* Card Content Skeleton */}
            <div className="px-4 space-y-3">
              {/* Category & Status Badges */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 bg-zinc-900/80 rounded-none" />
                <div className="h-4 w-14 bg-zinc-900/60 rounded-none" />
              </div>

              {/* Title & Employer */}
              <div className="space-y-1.5">
                <div className="h-5 w-3/4 bg-zinc-900 rounded-none" />
                <div className="h-3 w-1/3 bg-zinc-900/60 rounded-none" />
              </div>

              {/* Short Description */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full bg-zinc-900/50 rounded-none" />
                <div className="h-3 w-5/6 bg-zinc-900/50 rounded-none" />
              </div>

              {/* Tech Stack Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <div className="h-5 w-14 bg-zinc-900/80 border border-zinc-800/60 rounded-none" />
                <div className="h-5 w-16 bg-zinc-900/80 border border-zinc-800/60 rounded-none" />
                <div className="h-5 w-12 bg-zinc-900/80 border border-zinc-800/60 rounded-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
