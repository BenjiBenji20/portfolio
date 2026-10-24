export function HomeSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Overview & Mission Skeleton */}
      <section className="space-y-3">
        <div className="h-6 w-28 bg-zinc-900 rounded-none" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-zinc-900/60 rounded-none" />
          <div className="h-4 w-[92%] bg-zinc-900/60 rounded-none" />
          <div className="h-4 w-[75%] bg-zinc-900/60 rounded-none" />
        </div>

        {/* Focus Pillars Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-zinc-800/70" />
                <div className="h-4 w-24 bg-zinc-850 rounded-none" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full bg-zinc-900/50 rounded-none" />
                <div className="h-3 w-4/5 bg-zinc-900/50 rounded-none" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience Timeline Skeleton */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-zinc-900 rounded-none" />
          <div className="h-3.5 w-24 bg-zinc-900/50 rounded-none" />
        </div>

        <div className="space-y-6 border-l border-zinc-800/80 pl-4 sm:pl-6 ml-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative space-y-2">
              <span className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-800 ring-4 ring-zinc-950" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="h-4 w-56 bg-zinc-900 rounded-none" />
                <div className="h-3 w-28 bg-zinc-900/50 rounded-none" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full bg-zinc-900/50 rounded-none" />
                <div className="h-3 w-5/6 bg-zinc-900/50 rounded-none" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Skeleton */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-zinc-900 rounded-none" />
          <div className="h-3.5 w-24 bg-zinc-900/50 rounded-none" />
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-none overflow-hidden space-y-4 pb-4"
            >
              <div className="w-full aspect-[16/10] bg-zinc-900/60 border-b border-zinc-800/60 flex items-center justify-center">
                <div className="w-8 h-8 bg-zinc-850/50 border border-zinc-800/50" />
              </div>
              <div className="px-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-zinc-900/80 rounded-none" />
                  <div className="h-4 w-12 bg-zinc-900/60 rounded-none" />
                </div>
                <div className="h-4 w-48 bg-zinc-900 rounded-none" />
                <div className="space-y-1 pt-1">
                  <div className="h-3 w-full bg-zinc-900/50 rounded-none" />
                  <div className="h-3 w-4/5 bg-zinc-900/50 rounded-none" />
                </div>
                <div className="flex gap-1.5 pt-2">
                  <div className="h-4 w-12 bg-zinc-900/80 border border-zinc-800/60 rounded-none" />
                  <div className="h-4 w-14 bg-zinc-900/80 border border-zinc-800/60 rounded-none" />
                  <div className="h-4 w-10 bg-zinc-900/80 border border-zinc-800/60 rounded-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
