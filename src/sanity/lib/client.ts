import { createClient } from 'next-sanity';
import type {
  ContactData,
  EmailContactInquiryTemplateData,
  Experience,
  FocusPillar,
  ProfileData,
  ProjectData,
  SummaryOverviewData,
} from '@/types/sanity';
import {
  contactQuery,
  emailContactInquiryTemplateQuery,
  experiencesQuery,
  featuredProjectsQuery,
  focusPillarsQuery,
  profileQuery,
  summaryOverviewQuery,
} from './queries';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

export const client = projectId
  ? createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
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
  certifications: [
    {
      title: 'Google AI Professional',
      issuer: 'Google Career Certificates',
      date: 'October 2026',
    },
    {
      title: 'Computer Systems Servicing NCII',
      issuer: 'TESDA Navotas Training Institute',
      date: 'December 2025',
    },
  ],
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

export const FALLBACK_SUMMARY_OVERVIEW: SummaryOverviewData = {
  summaryText: [
    {
      _key: 'summary-p1',
      _type: 'block',
      children: [
        {
          _key: 'c1',
          text: 'Junior Backend Developer with hands-on experience architecting production-ready ',
        },
        {
          _key: 'c2',
          text: 'RAG systems',
          marks: ['strong'],
        },
        {
          _key: 'c3',
          text: ', full-stack web applications, and performing technical security assessments. Focused on scalable APIs, vector database partitioning, and autonomous agent workflows.',
        },
      ],
    },
  ],
};

export const FALLBACK_FOCUS_PILLARS: FocusPillar[] = [
  {
    _id: 'focus-1',
    title: 'RAG Pipelines',
    description: 'Multi-LLM token budgeting, Qdrant multi-tenant vector isolation, and cloud task workers.',
    order: 1,
  },
  {
    _id: 'focus-2',
    title: 'Backend Architecture',
    description: 'High-throughput FastAPI endpoints, PostgreSQL data modeling, and GCS signed URL pipelines.',
    order: 2,
  },
  {
    _id: 'focus-3',
    title: 'Security & Auditing',
    description: 'Black-box UI security testing, session vulnerability uncovering, and technical advisory reports.',
    order: 3,
  },
];

export const FALLBACK_EXPERIENCES: Experience[] = [
  {
    _id: 'exp-1',
    position: 'Freelance Software Engineer',
    employer: 'Casamento Events Management',
    employmentRange: 'Sep 2026 — Present',
    mainDescription:
      'Engineered and deployed a headless-CMS marketing website and admin booking/payment tracking portal using Next.js, Supabase, Sanity CMS, and Vercel.',
    accomplishments: [
      'Designed headless content pipeline syncing real-time wedding packages with Sanity Studio and GROQ.',
      'Structured automated inquiry dispatch service eliminating booking processing latency by 60%.',
      'Implemented secure client-side form validation paired with Edge runtime API handlers.',
    ],
    isCurrent: true,
    order: 1,
  },
  {
    _id: 'exp-2',
    position: 'IT Programmer / IT Admin',
    employer: 'Continental Sales Inc.',
    employmentRange: 'Jun 2026 — Sep 2026',
    mainDescription:
      'Conducted black-box UI security testing on ERP systems uncovering session management flaws; delivered executive technical risk audits; engineered serverless HR applicant evaluation portal.',
    accomplishments: [
      'Identified critical session fixation vulnerability in legacy enterprise inventory system.',
      'Automated HR applicant scoring workflow saving 15+ weekly hours of manual record handling.',
      'Authored technical risk evaluation documentation presented directly to department executives.',
    ],
    isCurrent: false,
    order: 2,
  },
  {
    _id: 'exp-3',
    position: 'Software Developer Intern',
    employer: 'Colour Variant Multimedia Services',
    employmentRange: 'Feb 2026 — Apr 2026',
    mainDescription:
      'Developed and deployed an automated 24/7 business chatbot integrating Python FastAPI and ChromaDB vector search with React and GCP infrastructure.',
    accomplishments: [
      'Orchestrated multi-document semantic retrieval pipeline reducing FAQ resolution time.',
      'Deployed containerized FastAPI endpoints on Google Cloud Platform with automated health checks.',
      'Constructed responsive chat widget with live streaming chunk tokens.',
    ],
    isCurrent: false,
    order: 3,
  },
];

export const FALLBACK_FEATURED_PROJECTS: ProjectData[] = [
  {
    _id: 'proj-1',
    title: 'IntelliChat (SaaS RAG System)',
    slug: { current: 'intellichat-rag' },
    shortDescription:
      'Production RAG orchestration with token budgeting, Google Cloud Tasks async document worker, and multi-tenant vector isolation in Qdrant.',
    projectType: 'RAG',
    employer: 'Freelance Client',
    website: 'https://intellichat.demo',
    repository: 'https://github.com/BenjiBenji20/intellichat-rag',
    techStacks: ['FastAPI', 'Qdrant', 'Cloud Tasks', 'GCS', 'Gemini'],
    status: 'production',
    featured: true,
    hidden: false,
    priorityValue: 10,
  },
  {
    _id: 'proj-2',
    title: 'Smart Traffic Monitoring & Analytics',
    slug: { current: 'smart-traffic-monitoring' },
    shortDescription:
      'YOLOv8 vehicle detection pipeline on Raspberry Pi Zero 2 W with FB Prophet time-series congestion forecasting for Malabon LGU.',
    projectType: 'Edge AI',
    employer: 'City of Malabon LGU',
    repository: 'https://github.com/BenjiBenji20/traffic-analytics',
    techStacks: ['Python', 'YOLOv8', 'FB Prophet', 'RPi', 'Edge AI'],
    status: 'completed',
    featured: true,
    hidden: false,
    priorityValue: 9,
  },
  {
    _id: 'proj-3',
    title: 'Casamento Events Booking Portal',
    slug: { current: 'casamento-portal' },
    shortDescription:
      'Headless CMS marketing site and client booking portal featuring real-time schedule checks, payment tracking, and Sanity CMS integration.',
    projectType: 'Public Site',
    employer: 'Casamento Events Management',
    website: 'https://casamento.vercel.app',
    techStacks: ['Next.js', 'Sanity CMS', 'Supabase', 'TailwindCSS'],
    status: 'production',
    featured: true,
    hidden: false,
    priorityValue: 8,
  },
  {
    _id: 'proj-4',
    title: 'Autonomous Agent Workflow Engine',
    slug: { current: 'agentic-workflow-engine' },
    shortDescription:
      'Event-driven multi-agent orchestration framework utilizing tool-use execution, human-in-the-loop gates, and semantic memory.',
    projectType: 'Automation',
    repository: 'https://github.com/BenjiBenji20/agent-engine',
    techStacks: ['Python', 'LangGraph', 'FastAPI', 'Redis'],
    status: 'development',
    featured: true,
    hidden: false,
    priorityValue: 7,
  },
];

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

export async function getSummaryOverview(): Promise<SummaryOverviewData> {
  'use cache';
  if (!client) {
    return FALLBACK_SUMMARY_OVERVIEW;
  }
  try {
    const data = await client.fetch<SummaryOverviewData | null>(summaryOverviewQuery);
    return data || FALLBACK_SUMMARY_OVERVIEW;
  } catch (error) {
    console.warn('[Sanity Client] Fetch failed for summaryOverview, falling back to local defaults:', error);
    return FALLBACK_SUMMARY_OVERVIEW;
  }
}

export async function getFocusPillars(): Promise<FocusPillar[]> {
  'use cache';
  if (!client) {
    return FALLBACK_FOCUS_PILLARS;
  }
  try {
    const data = await client.fetch<FocusPillar[]>(focusPillarsQuery);
    return data && data.length > 0 ? data : FALLBACK_FOCUS_PILLARS;
  } catch (error) {
    console.warn('[Sanity Client] Fetch failed for focusPillars, falling back to local defaults:', error);
    return FALLBACK_FOCUS_PILLARS;
  }
}

export async function getExperiences(): Promise<Experience[]> {
  'use cache';
  if (!client) {
    return FALLBACK_EXPERIENCES;
  }
  try {
    const data = await client.fetch<Experience[]>(experiencesQuery);
    return data && data.length > 0 ? data : FALLBACK_EXPERIENCES;
  } catch (error) {
    console.warn('[Sanity Client] Fetch failed for experiences, falling back to local defaults:', error);
    return FALLBACK_EXPERIENCES;
  }
}

export async function getFeaturedProjects(): Promise<ProjectData[]> {
  'use cache';
  if (!client) {
    return FALLBACK_FEATURED_PROJECTS;
  }
  try {
    const data = await client.fetch<ProjectData[]>(featuredProjectsQuery);
    return data && data.length > 0 ? data : FALLBACK_FEATURED_PROJECTS;
  } catch (error) {
    console.warn('[Sanity Client] Fetch failed for featured projects, falling back to local defaults:', error);
    return FALLBACK_FEATURED_PROJECTS;
  }
}

export const FALLBACK_CONTACT: ContactData = {
  header: "Let's connect!",
  shortDescription:
    "Let's build high-impact systems starts with a conversation. Currently Open for Junior Roles.",
  followUp: 'or message me in my other socials',
  contacts: [
    {
      _key: 'c1',
      platform: 'Email',
      handle: 'benjicanones6@gmail.com',
      link: 'mailto:benjicanones6@gmail.com',
    },
    {
      _key: 'c2',
      platform: 'GitHub',
      handle: 'BenjiBenji20',
      link: 'https://github.com/BenjiBenji20',
    },
    {
      _key: 'c3',
      platform: 'LinkedIn',
      handle: 'Benji Cañones',
      link: 'https://linkedin.com/in/benji-cañones',
    },
  ],
  subjects: [
    'Job Opportunity',
    'Technical Inquiry',
    'Just saying hi!',
  ],
};

export async function getContactData(): Promise<ContactData> {
  'use cache';
  if (!client) {
    return FALLBACK_CONTACT;
  }
  try {
    const data = await client.fetch<ContactData | null>(contactQuery);
    return data || FALLBACK_CONTACT;
  } catch (error) {
    console.warn('[Sanity Client] Fetch failed for contact data, falling back to local defaults:', error);
    return FALLBACK_CONTACT;
  }
}

export const FALLBACK_EMAIL_INQUIRY_TEMPLATE: EmailContactInquiryTemplateData = {
  dispatchType: 'Visitor Contact Email',
  subjectPrefix: '[Portfolio Contact]',
  headline: 'New Inquiry from Portfolio Contact Form',
  footerNote:
    'Dispatched securely via Benjineer Portfolio. Reply directly to this email to respond.',
};

export async function getEmailContactInquiryTemplate(): Promise<EmailContactInquiryTemplateData> {
  if (!client) {
    return FALLBACK_EMAIL_INQUIRY_TEMPLATE;
  }
  try {
    const data = await client.fetch<EmailContactInquiryTemplateData | null>(
      emailContactInquiryTemplateQuery
    );
    return data || FALLBACK_EMAIL_INQUIRY_TEMPLATE;
  } catch (error) {
    console.warn(
      '[Sanity Client] Fetch failed for email inquiry template, falling back to local defaults:',
      error
    );
    return FALLBACK_EMAIL_INQUIRY_TEMPLATE;
  }
}

