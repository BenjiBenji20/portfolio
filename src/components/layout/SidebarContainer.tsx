'use client';

import { usePathname } from 'next/navigation';

interface SidebarContainerProps {
  children: React.ReactNode;
}

export function SidebarContainer({ children }: SidebarContainerProps) {
  const pathname = usePathname();
  const isProjectsRoute = pathname?.startsWith('/projects');

  return (
    <div
      className={
        isProjectsRoute
          ? 'hidden lg:block shrink-0'
          : 'w-full md:w-64 lg:w-72 shrink-0'
      }
    >
      {children}
    </div>
  );
}
