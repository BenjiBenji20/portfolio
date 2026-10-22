import { Suspense } from 'react';
import { getProfile } from '@/sanity/lib/client';
import { HeaderNav } from './HeaderNav';
import { ProfileSidebar } from './ProfileSidebar';

interface AppShellProps {
  children: React.ReactNode;
}

async function AsyncSidebar() {
  const profile = await getProfile();
  return <ProfileSidebar profile={profile} />;
}

function SidebarSkeleton() {
  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4 md:flex-col md:items-start">
          <div className="h-20 w-20 md:h-52 md:w-52 rounded-full bg-zinc-900 ring-2 ring-zinc-800" />
          <div className="flex-1 space-y-2 mt-2 w-full">
            <div className="h-6 w-36 bg-zinc-800 rounded" />
            <div className="h-4 w-48 bg-zinc-900 rounded" />
            <div className="h-3 w-56 bg-zinc-900/60 rounded mt-2" />
          </div>
        </div>
        <div className="h-5 w-44 rounded-full bg-zinc-900" />
        <hr className="border-zinc-800/60 my-1" />
        <div className="space-y-3">
          <div className="h-3.5 w-48 bg-zinc-900 rounded" />
          <div className="h-3.5 w-40 bg-zinc-900 rounded" />
          <div className="h-3.5 w-52 bg-zinc-900 rounded" />
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Top Navigation */}
      <HeaderNav />

      {/* Main Grid Wrapper */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-12">
          {/* Persistent Profile Sidebar with Suspense */}
          <Suspense fallback={<SidebarSkeleton />}>
            <AsyncSidebar />
          </Suspense>

          {/* Dynamic Page Content Slot */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
