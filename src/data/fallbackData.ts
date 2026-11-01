import { cacheTag } from 'next/cache';
import type {
    ArticleData,
    BlogData,
    ContactData,
    EmailContactInquiryTemplateData,
    Experience,
    FocusPillar,
    ProfileData,
    ProjectData,
    SummaryOverviewData,
    WorkLogData,
} from '@/types/sanity';
import {
    allProjectsQuery,
    articleBySlugsQuery,
    articlesByProjectSlugQuery,
    blogQuery,
    contactQuery,
    emailContactInquiryTemplateQuery,
    experiencesQuery,
    featuredProjectsQuery,
    focusPillarsQuery,
    profileQuery,
    projectBySlugQuery,
    summaryOverviewQuery,
    workLogsByProjectSlugQuery,
} from '@/sanity/lib/queries';
import { client } from '@/sanity/lib/client';

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
        employer: 'Casamento Events Management',
        employmentRange: 'Apr 2026 — Jun 2026',
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

export async function getProfile(): Promise<ProfileData> {
    'use cache';
    cacheTag('sanity:profile', 'sanity');
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
    cacheTag('sanity:summaryOverview', 'sanity');
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
    cacheTag('sanity:focusPillar', 'sanity');
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
    cacheTag('sanity:experience', 'sanity');
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
    cacheTag('sanity:project', 'sanity');
    if (!client) {
        return [];
    }
    try {
        const data = await client.fetch<ProjectData[]>(featuredProjectsQuery);
        return data || [];
    } catch (error) {
        console.warn('[Sanity Client] Fetch failed for featured projects:', error);
        return [];
    }
}

export async function getAllProjects(): Promise<ProjectData[]> {
    'use cache';
    cacheTag('sanity:project', 'sanity');
    if (!client) {
        return [];
    }
    try {
        const data = await client.fetch<ProjectData[]>(allProjectsQuery);
        return data || [];
    } catch (error) {
        console.warn('[Sanity Client] Fetch failed for all projects:', error);
        return [];
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
    cacheTag('sanity:contact', 'sanity');
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
    'use cache';
    cacheTag('sanity:emailContactInquiryTemplate', 'sanity');
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

export async function getBlog(): Promise<BlogData> {
    'use cache';
    cacheTag('sanity:blog', 'sanity');
    const emptyBlog: BlogData = {
        title: 'Software Engineering Background & Works',
        content: [],
    };
    if (!client) {
        return emptyBlog;
    }
    try {
        const data = await client.fetch<BlogData | null>(blogQuery);
        return data || emptyBlog;
    } catch (error) {
        console.warn('[Sanity Client] Fetch failed for blog:', error);
        return emptyBlog;
    }
}

export async function getProjectBySlug(slug: string): Promise<ProjectData | null> {
    'use cache';
    cacheTag('sanity:project', `sanity:project:${slug}`);
    if (!client) {
        return null;
    }
    try {
        const data = await client.fetch<ProjectData | null>(projectBySlugQuery, { slug });
        return data || null;
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for project ${slug}:`, error);
        return null;
    }
}

export async function getArticlesByProjectSlug(projectSlug: string): Promise<ArticleData[]> {
    'use cache';
    cacheTag('sanity:article', `sanity:articles:${projectSlug}`);
    if (!client) {
        return [];
    }
    try {
        const data = await client.fetch<ArticleData[] | null>(articlesByProjectSlugQuery, { projectSlug });
        return data || [];
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for articles of project ${projectSlug}:`, error);
        return [];
    }
}

export async function getWorkLogsByProjectSlug(projectSlug: string): Promise<WorkLogData[]> {
    'use cache';
    cacheTag('sanity:workLog', `sanity:workLogs:${projectSlug}`);
    if (!client) {
        return [];
    }
    try {
        const data = await client.fetch<WorkLogData[] | null>(workLogsByProjectSlugQuery, { projectSlug });
        return data || [];
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for work logs of project ${projectSlug}:`, error);
        return [];
    }
}

export async function getArticleBySlugs(projectSlug: string, articleSlug?: string): Promise<ArticleData | null> {
    'use cache';
    cacheTag('sanity:article', `sanity:article:${projectSlug}:${articleSlug || 'default'}`);
    if (!client) {
        return null;
    }
    try {
        if (articleSlug) {
            const data = await client.fetch<ArticleData | null>(articleBySlugsQuery, {
                projectSlug,
                articleSlug,
            });
            if (data) return data;
        }
        const articles = await client.fetch<ArticleData[] | null>(articlesByProjectSlugQuery, { projectSlug });
        if (articles && articles.length > 0) {
            return articles[0];
        }
        return null;
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for article ${articleSlug} of project ${projectSlug}:`, error);
        return null;
    }
}
