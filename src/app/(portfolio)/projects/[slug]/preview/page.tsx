import { redirect } from 'next/navigation';

interface ProjectsRedirectProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectsRedirectPage({
  params,
}: ProjectsRedirectProps) {
  const { slug } = await params;
  redirect(`/project/${slug}/preview`);
}
