import { Suspense } from 'react';
import { getContactData, getProfile } from '@/data/fallbackData';
import { HeaderNav } from './HeaderNav';
import { ProfileSidebar } from './ProfileSidebar';
import { SidebarContainer } from './SidebarContainer';
import { ContactSection } from '@/components/contact/ContactSection';
import { NavigationTracker } from './NavigationTracker';

interface AppShellProps {
  children: React.ReactNode;
}

async function AsyncSidebar() {
  const profile = await getProfile();
  return <ProfileSidebar profile={profile} />;
}

async function AsyncContactSection() {
  const contactData = await getContactData();
  return <ContactSection contactData={contactData} />;
}

function HeaderNavSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="h-5 w-28 rounded bg-zinc-800 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 rounded bg-zinc-800/60 animate-pulse" />
          <div className="h-5 w-16 rounded bg-zinc-800/60 animate-pulse" />
          <div className="h-5 w-10 rounded bg-zinc-800/60 animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded-md bg-zinc-800/60 animate-pulse" />
      </div>
    </header>
  );
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

function ContactSkeleton() {
  return (
    <div className="w-full pt-10 border-t border-zinc-800/80 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <div className="h-8 w-48 bg-zinc-900 rounded" />
          <div className="h-4 w-72 bg-zinc-900/70 rounded" />
          <div className="h-4 w-52 bg-zinc-900/50 rounded" />
        </div>
        <div className="lg:col-span-7 space-y-4">
          <div className="h-20 bg-zinc-900/50 rounded-lg" />
          <div className="h-10 bg-zinc-900/50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-sky-500/20 selection:text-sky-400">
      {/* Top Navigation */}
      <Suspense fallback={<HeaderNavSkeleton />}>
        <HeaderNav />
      </Suspense>

      {/* Navigation history tracker for dynamic BackButton behavior */}
      <Suspense fallback={null}>
        <NavigationTracker />
      </Suspense>

      {/* Main Grid Wrapper */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10 space-y-16">
        <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-12">
          {/* Persistent Profile Sidebar with Suspense */}
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarContainer>
              <Suspense fallback={<SidebarSkeleton />}>
                <AsyncSidebar />
              </Suspense>
            </SidebarContainer>
          </Suspense>

          {/* Dynamic Page Content Slot */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>

        {/* Global Contact Section with Suspense */}
        <Suspense fallback={<ContactSkeleton />}>
          <AsyncContactSection />
        </Suspense>
      </div>
    </div>
  );
}
