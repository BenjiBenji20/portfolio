import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getBlog, getAllProjects } from '@/data/fallbackData';
import { BlogContentClient } from '@/components/blog/BlogContentClient';
import { BlogSkeleton } from '@/components/blog/BlogSkeleton';

export const metadata: Metadata = {
  title: 'Blog | Software Engineering Works',
  description:
    'Deep architectural background, production systems, and engineering works by Benji I. Cañones.',
};

async function BlogContent() {
  const [blog, projects] = await Promise.all([
    getBlog(),
    getAllProjects(),
  ]);

  return <BlogContentClient blog={blog} projects={projects} />;
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogSkeleton />}>
      <BlogContent />
    </Suspense>
  );
}

