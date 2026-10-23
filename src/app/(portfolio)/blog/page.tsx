import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getBlog, getAllProjects } from '@/sanity/lib/client';
import { BlogContentClient } from '@/components/blog/BlogContentClient';
import { BlogSkeleton } from '@/components/blog/BlogSkeleton';

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
    <Suspense fallback={<BlogSkeleton />}>
      <BlogContentClient blog={blog} projects={projects} />
    </Suspense>
  );
}

