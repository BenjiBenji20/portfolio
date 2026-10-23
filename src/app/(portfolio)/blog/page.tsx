import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getBlog, getAllProjects } from '@/sanity/lib/client';
import { BlogContentClient } from '@/components/blog/BlogContentClient';

export const metadata: Metadata = {
  title: 'Blog | Software Engineering Works',
  description:
    'Deep architectural background, production systems, and engineering works by Benji I. Cañones.',
};

export default async function BlogPage() {
  const [blog, projects] = await Promise.all([
    getBlog(),
    getAllProjects(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="w-full space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-zinc-900 rounded-none" />
          <div className="h-4 w-96 bg-zinc-900/60 rounded-none" />
          <div className="h-64 w-full bg-zinc-900/40 rounded-none mt-8" />
        </div>
      }
    >
      <BlogContentClient blog={blog} projects={projects} />
    </Suspense>
  );
}
