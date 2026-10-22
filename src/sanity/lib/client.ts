import { createClient } from 'next-sanity';
import type { ProfileData } from '@/types/sanity';
import { profileQuery } from './queries';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

export const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
    })
  : null;

// Defensive fallback seeded directly from Benji's resume
export const FALLBACK_PROFILE: ProfileData = {
  fullName: 'Benji I. Cañones',
  headline: 'Junior Backend Developer',
  motto: 'Crafting robust RAG systems, scalable backend architectures, and AI integrations.',
  status: {
    isAvailable: true,
    statusMessage: 'Open to engineering opportunities',
  },
  currentAffiliation: {
    role: 'Freelance Software Engineer',
    company: 'Casamento Events Management',
    url: 'https://casamento.vercel.app',
  },
  location: 'Malabon, NCR, Philippines',
  education: {
    degree: 'BS in Information Technology',
    institution: 'City of Malabon University',
    period: '2022 - 2026',
  },
  socialLinks: {
    github: 'https://github.com/BenjiBenji20',
    linkedin: 'https://linkedin.com/in/benji-cañones',
    email: 'benjicanones6@gmail.com',
    website: 'https://benjineer.vercel.app',
  },
  featuredSkills: [
    'Python',
    'FastAPI',
    'TypeScript',
    'PostgreSQL',
    'Qdrant',
    'GCP',
  ],
};

export async function getProfile(): Promise<ProfileData> {
  'use cache';
  if (!client) {
    return FALLBACK_PROFILE;
  }
  try {
    const data = await client.fetch<ProfileData | null>(profileQuery);
    return data || FALLBACK_PROFILE;
  } catch (error) {
    console.warn('[Sanity Client] Fetch failed, falling back to local resume defaults:', error);
    return FALLBACK_PROFILE;
  }
}
