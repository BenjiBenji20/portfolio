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
        author: 'Human',
        dateStarted: '2026-01-15',
        dateFinished: '2026-10-20',
        organization: 'Cañones Labs',
        collaborators: [{ name: 'Benji Cañones', role: 'Lead Architect' }],
        featured: true,
        hidden: false,
        priorityValue: 10,
        media: [
            {
                _key: 'm1-1',
                _type: 'projectMediaImage',
                asset: {
                    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
                },
                alt: 'IntelliChat Infrastructure and Vector Database',
                caption: 'Distributed document ingestion pipelines',
            },
            {
                _key: 'm1-2',
                _type: 'projectMediaImage',
                asset: {
                    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
                },
                alt: 'Vector Embeddings and Semantic Indexing',
            },
        ],
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
        author: 'Human',
        dateStarted: '2026-03-01',
        dateFinished: '2026-09-15',
        collaborators: [{ name: 'Benji Cañones', role: 'Edge AI Engineer' }],
        featured: true,
        hidden: false,
        priorityValue: 9,
        media: [
            {
                _key: 'm2-1',
                _type: 'projectMediaImage',
                asset: {
                    url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
                },
                alt: 'Urban Traffic Sensor Deployment and Edge AI',
            },
            {
                _key: 'm2-2',
                _type: 'projectMediaYoutube',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Edge AI Detection Demonstration',
            },
        ],
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
        author: 'Human',
        dateStarted: '2026-05-10',
        dateFinished: '2026-10-15',
        organization: 'Casamento Events',
        collaborators: [{ name: 'Benji Cañones', role: 'Full-Stack Developer' }],
        featured: true,
        hidden: false,
        priorityValue: 8,
        media: [
            {
                _key: 'm3-1',
                _type: 'projectMediaImage',
                asset: {
                    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
                },
                alt: 'Casamento Booking Experience & Calendar',
            },
            {
                _key: 'm3-2',
                _type: 'projectMediaImage',
                asset: {
                    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
                },
                alt: 'Event Management Dashboard',
            },
        ],
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
        author: 'Agentic Writer',
        dateStarted: '2026-08-01',
        collaborators: [{ name: 'Benji Cañones', role: 'Core Contributor' }],
        featured: true,
        hidden: false,
        priorityValue: 7,
        media: [
            {
                _key: 'm4-1',
                _type: 'projectMediaImage',
                asset: {
                    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                },
                alt: 'Agentic Graph Topology and State Machine',
            },
        ],
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

export async function getAllProjects(): Promise<ProjectData[]> {
    'use cache';
    cacheTag('sanity:project', 'sanity');
    if (!client) {
        return FALLBACK_FEATURED_PROJECTS;
    }
    try {
        const data = await client.fetch<ProjectData[]>(allProjectsQuery);
        return data && data.length > 0 ? data : FALLBACK_FEATURED_PROJECTS;
    } catch (error) {
        console.warn('[Sanity Client] Fetch failed for all projects, falling back to local defaults:', error);
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

export const FALLBACK_BLOG: BlogData = {
    title: 'Software Engineering Background & Works',
    publishedAt: '2026-10-23T00:00:00.000Z',
    readTime: '8 min read',
    content: [
        {
            _key: 'b1',
            _type: 'block',
            style: 'normal',
            children: [
                {
                    _key: 'b1c1',
                    _type: 'span',
                    text: 'This workspace documents my engineering background, core architectural patterns, and production systems as a Software Engineer. Here you will find deep technical walkthroughs of how I design scalable backends, multi-tenant vector databases, resilient RAG pipelines, and automated security evaluation gates.',
                },
            ],
        },
        {
            _key: 'b2',
            _type: 'block',
            style: 'h2',
            children: [
                {
                    _key: 'b2c1',
                    _type: 'span',
                    text: 'Casamento Events RAG Architecture',
                },
            ],
        },
        {
            _key: 'b3',
            _type: 'block',
            style: 'normal',
            children: [
                {
                    _key: 'b3c1',
                    _type: 'span',
                    text: 'Casamento Events Management required a high-reliability customer inquiry and automated booking assistant capable of grounded contextual responses. I architected a hybrid retrieval pipeline pairing FastAPI services with Qdrant vector storage and Gemini Flash embedding models.',
                },
            ],
        },
        {
            _key: 'b4',
            _type: 'projectMediaImage',
            alt: 'Casamento Events Platform Architecture',
            title: 'Casamento Events Multi-Tenant System Architecture',
            description: 'End-to-end topology diagram displaying user inquiry dispatch, Google reCAPTCHA v3 bot verification, FastAPI routing, and asynchronous Qdrant vector lookups.',
            publishedAt: '2026-10-20T00:00:00.000Z',
            readTime: '2 min read',
            backlinks: [
                {
                    _key: 'l1',
                    platform: 'Live Website',
                    url: 'https://casamento.vercel.app',
                },
                {
                    _key: 'l2',
                    platform: 'GitHub',
                    url: 'https://github.com/BenjiBenji20',
                },
            ],
            asset: {
                url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
            },
        },
        {
            _key: 'b5',
            _type: 'block',
            style: 'h2',
            children: [
                {
                    _key: 'b5c1',
                    _type: 'span',
                    text: 'Multi-Tenant Vector Isolation in Qdrant',
                },
            ],
        },
        {
            _key: 'b6',
            _type: 'block',
            style: 'normal',
            children: [
                {
                    _key: 'b6c1',
                    _type: 'span',
                    text: 'To avoid vector cross-contamination and ensure microsecond query execution across distinct operational scopes, I partitioned Qdrant vector collections using payload filtering schemas rather than creating dynamic collections per tenant. This eliminated resource spikes and streamlined index optimization.',
                },
            ],
        },
        {
            _key: 'b7',
            _type: 'block',
            style: 'h2',
            children: [
                {
                    _key: 'b7c1',
                    _type: 'span',
                    text: 'Serverless Ingestion & HMAC Webhook Pipelines',
                },
            ],
        },
        {
            _key: 'b8',
            _type: 'block',
            style: 'normal',
            children: [
                {
                    _key: 'b8c1',
                    _type: 'span',
                    text: 'Implementing on-demand content revalidation and git-driven ingestion required rigorous security barriers. Using cryptographic HMAC SHA-256 verification, our ingestion handlers filter out non-essential commits, detect bot activity, and perform synchronous tiered evaluation before initiating heavier generation or cache invalidation routines.',
                },
            ],
        },
        {
            _key: 'b9',
            _type: 'projectMediaYoutube',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Real-time Ingestion & Revalidation Pipeline Demo',
            description: 'Walkthrough demonstration of instantaneous cache purging across Next.js ISR route handlers triggered by Sanity content webhooks.',
            publishedAt: '2026-10-22T00:00:00.000Z',
            readTime: '4 min demo',
            backlinks: [
                {
                    _key: 'yt-l1',
                    platform: 'Repository',
                    url: 'https://github.com/BenjiBenji20',
                },
            ],
        },
        {
            _key: 'b10',
            _type: 'block',
            style: 'h2',
            children: [
                {
                    _key: 'b10c1',
                    _type: 'span',
                    text: 'Technical Security Assessments & Penetration Audits',
                },
            ],
        },
        {
            _key: 'b11',
            _type: 'block',
            style: 'normal',
            children: [
                {
                    _key: 'b11c1',
                    _type: 'span',
                    text: 'Beyond software creation, I conduct black-box and white-box assessments across web endpoints and enterprise software workflows. This involves identifying insecure session parameters, analyzing cross-origin request policies, hardening API route handlers against bot floods via Google reCAPTCHA v3, and validating cryptographic secrets integrity.',
                },
            ],
        },
    ],
};

export async function getBlog(): Promise<BlogData> {
    'use cache';
    cacheTag('sanity:blog', 'sanity');
    if (!client) {
        return FALLBACK_BLOG;
    }
    try {
        const data = await client.fetch<BlogData | null>(blogQuery);
        return data || FALLBACK_BLOG;
    } catch (error) {
        console.warn('[Sanity Client] Fetch failed for blog, falling back to local defaults:', error);
        return FALLBACK_BLOG;
    }
}

export async function getProjectBySlug(slug: string): Promise<ProjectData | null> {
    'use cache';
    cacheTag('sanity:project', `sanity:project:${slug}`);
    if (!client) {
        return (
            FALLBACK_FEATURED_PROJECTS.find(
                (p) => (typeof p.slug === 'string' ? p.slug : p.slug?.current) === slug
            ) || null
        );
    }
    try {
        const data = await client.fetch<ProjectData | null>(projectBySlugQuery, { slug });
        return (
            data ||
            FALLBACK_FEATURED_PROJECTS.find(
                (p) => (typeof p.slug === 'string' ? p.slug : p.slug?.current) === slug
            ) ||
            null
        );
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for project ${slug}:`, error);
        return (
            FALLBACK_FEATURED_PROJECTS.find(
                (p) => (typeof p.slug === 'string' ? p.slug : p.slug?.current) === slug
            ) || null
        );
    }
}

export const FALLBACK_ARTICLES: ArticleData[] = [
    {
        _id: 'art-rag-1',
        title: 'Architectural Deep Dive: Multi-Tenant RAG & Stream Buffering',
        slug: { current: 'rag-orchestration-architecture' },
        projectSlug: 'casamento-events-management',
        excerpt:
            'A comprehensive exploration of multi-tenant isolation, token budgeting algorithms, and asynchronous ingestion worker queues in production.',
        imageUrl:
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        coverImage: {
            asset: {
                url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
            },
            alt: 'RAG Architecture Diagram',
        },
        publishedAt: '2026-10-20T00:00:00.000Z',
        readTime: '6 min read',
        priorityValue: 10,
        author: 'Human',
        developers: ['Benji Cañones'],
        hidden: false,
        content: [
            {
                _key: 'h2-1',
                _type: 'block',
                style: 'h2',
                children: [{ _key: 'c1', _type: 'span', text: 'Executive Overview' }],
            },
            {
                _key: 'wlc-1-mm',
                _type: 'code',
                language: 'mermaid',
                code: 'graph TD\n  Client[Web Visitor] -->|Instant Shell| SuspenseBoundary[Streaming Shell Boundary]\n  SuspenseBoundary -->|Background Prefetch| DynamicContent[Hydrated Cache Component]\n  DynamicContent -->|PPR Ready| CompleteUI[Instant Visual State]',
            },
            {
                _key: 'p-1',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'c2',
                        _type: 'span',
                        text: 'When designing production architectures, our primary mandate is balancing strict tenant isolation with predictable p99 inference latency. Traditional multi-tenant deployments frequently encounter resource starvation under heavy ingestion spikes. By decoupling ingestion from retrieval and implementing constant-time payload lookups, we achieved sub-50ms latency across multi-thousand chunk datasets.',
                    },
                ],
            },
            {
                _key: 'h2-2',
                _type: 'block',
                style: 'h2',
                children: [{ _key: 'c3', _type: 'span', text: 'Topology & System Design' }],
            },
            {
                _key: 'p-2',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'c4',
                        _type: 'span',
                        text: 'The system operates on an asynchronous event-driven topology. Incoming document payloads undergo cryptographic HMAC SHA-256 verification before entering a background Google Cloud Tasks worker queue.',
                    },
                ],
            },
            {
                _key: 'h2-3',
                _type: 'block',
                style: 'h2',
                children: [{ _key: 'c5', _type: 'span', text: 'Vector Ingestion Pipeline' }],
            },
            {
                _key: 'p-3',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'c6',
                        _type: 'span',
                        text: 'Payload filtering schemas partition a unified vector collection. Rather than maintaining thousands of small individual collections, payload schemas partition a unified collection. This design drastically reduces RAM overhead while preserving hard cryptographic boundary guarantees.',
                    },
                ],
            },
            {
                _key: 'h2-4',
                _type: 'block',
                style: 'h2',
                children: [{ _key: 'c7', _type: 'span', text: 'Key Engineering Takeaways' }],
            },
            {
                _key: 'p-4',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'c8',
                        _type: 'span',
                        text: 'Modular architecture and early boundary definition were the cornerstones of delivering a robust, scalable system that stands up to production rigor.',
                    },
                ],
            },
        ],
    },
    {
        _id: 'art-rag-2',
        title: 'Vector Partitioning & Payload Schemas in Qdrant',
        slug: { current: 'vector-partitioning-qdrant' },
        projectSlug: 'casamento-events-management',
        excerpt:
            'How payload filtering schemas prevented cross-tenant contamination while maintaining sub-millisecond similarity lookups.',
        imageUrl:
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        coverImage: {
            asset: {
                url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            },
            alt: 'Qdrant Vector Partitioning',
        },
        publishedAt: '2026-10-14T00:00:00.000Z',
        readTime: '4 min read',
        priorityValue: 8,
        author: 'Agentic Writer',
        developers: ['Benji Cañones', 'Agentic Writer'],
        hidden: false,
        content: [
            {
                _key: 'vp-1',
                _type: 'block',
                style: 'h2',
                children: [{ _key: 'vpc1', _type: 'span', text: 'Partitioning Strategy' }],
            },
            {
                _key: 'vp-2',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'vpc2',
                        _type: 'span',
                        text: 'Using Qdrant payload filters rather than distinct collections allows multi-tenant clusters to share memory structures while enforcing hard isolation via cryptographic tenant IDs.',
                    },
                ],
            },
        ],
    },
    {
        _id: 'art-rag-3',
        title: 'Cryptographic Webhook Intake & On-Demand Revalidation',
        slug: { current: 'hmac-security-revalidation' },
        projectSlug: 'casamento-events-management',
        excerpt:
            'Implementing cryptographic HMAC SHA-256 validation pipelines with cloud functions to securely filter non-essential payloads.',
        imageUrl:
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        coverImage: {
            asset: {
                url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
            },
            alt: 'Cryptographic Webhook Security',
        },
        publishedAt: '2026-10-08T00:00:00.000Z',
        readTime: '5 min read',
        priorityValue: 6,
        author: 'Human',
        developers: ['Benji Cañones'],
        hidden: false,
        content: [
            {
                _key: 'hm-1',
                _type: 'block',
                style: 'h2',
                children: [{ _key: 'hmc1', _type: 'span', text: 'HMAC Authentication Pipeline' }],
            },
            {
                _key: 'hm-2',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'hmc2',
                        _type: 'span',
                        text: 'Cryptographic signatures verify webhook origin in constant time before downstream tasks execute, mitigating spoofing attacks.',
                    },
                ],
            },
        ],
    },
    {
        _id: 'art-rag-4',
        title: 'Benchmarking Multi-LLM Latencies & Token Economics',
        slug: { current: 'evaluating-llm-latencies' },
        projectSlug: 'casamento-events-management',
        excerpt:
            'Comparative study on latency trade-offs, fallback routing tiers, and cache hydration efficiency across production workloads.',
        imageUrl:
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        coverImage: {
            asset: {
                url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
            },
            alt: 'LLM Latencies and Token Economics',
        },
        publishedAt: '2026-09-29T00:00:00.000Z',
        readTime: '7 min read',
        priorityValue: 4,
        author: 'Agentic Writer',
        developers: ['Benji Cañones', 'Agentic Writer'],
        hidden: false,
        content: [
            {
                _key: 'llm-1',
                _type: 'block',
                style: 'h2',
                children: [{ _key: 'llmc1', _type: 'span', text: 'Inference Latency Trade-offs' }],
            },
            {
                _key: 'llm-2',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'llmc2',
                        _type: 'span',
                        text: 'Tiered model fallbacks route latency-sensitive tasks to smaller models while delegating deep reasoning to higher parameter models.',
                    },
                ],
            },
        ],
    },
];

export const FALLBACK_WORK_LOGS: WorkLogData[] = [
    {
        _id: 'wl-1',
        title: 'PPR & Cache Components Integration',
        projectSlug: 'casamento-events-management',
        badge: 'Production Release',
        date: '2026-10-23',
        description:
            'Migrated layout boundaries to streaming Suspense shells for sub-50ms instant initial paint with Next.js 16 Partial Prefetching.',
        content: [
            {
                _key: 'wlc-1',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'sp-1',
                        _type: 'span',
                        text: 'Migrated layout boundaries to streaming Suspense shells for sub-50ms instant initial paint with Next.js 16 Partial Prefetching.',
                    },
                ],
            },
            {
                _key: 'wlc-1-mm',
                _type: 'code',
                language: 'mermaid',
                code: 'graph TD\n  Client[Web Visitor] -->|Instant Shell| SuspenseBoundary[Streaming Shell Boundary]\n  SuspenseBoundary -->|Background Prefetch| DynamicContent[Hydrated Cache Component]\n  DynamicContent -->|PPR Ready| CompleteUI[Instant Visual State]',
            },
        ],
        commitSha: 'bc3492e',
        developers: ['Benji Cañones'],
        author: 'Agentic Writer',
        backlinks: [
            {
                _key: 'bl-1',
                platform: 'GitHub Diff',
                url: 'https://github.com/BenjiBenji20',
            },
        ],
    },
    {
        _id: 'wl-2',
        title: 'Asynchronous Document Chunking Worker',
        projectSlug: 'casamento-events-management',
        badge: 'Optimization',
        date: '2026-10-18',
        description:
            'Offloaded vector embedding generation to background Google Cloud Tasks worker to prevent blocking HTTP handler timeouts.',
        content: [
            {
                _key: 'wlc-2',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'sp-2',
                        _type: 'span',
                        text: 'Offloaded vector embedding generation to background Google Cloud Tasks worker to prevent blocking HTTP handler timeouts.',
                    },
                ],
            },
            {
                _key: 'wlc-2-img',
                _type: 'projectMediaImage',
                alt: 'Google Cloud Tasks Ingestion Pipeline',
                title: 'Asynchronous Vector Ingestion Worker Queue',
                caption: 'Background worker decoupling HTTP intake from heavy Gemini vectorization',
                asset: {
                    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
                },
            },
        ],
        commitSha: '7f9a12c',
        developers: ['Benji Cañones'],
        author: 'Human',
        backlinks: [
            {
                _key: 'bl-2',
                platform: 'Cloud Tasks Documentation',
                url: 'https://cloud.google.com/tasks',
            },
        ],
    },
    {
        _id: 'wl-3',
        title: 'HMAC Webhook Intake & Rate Limiting',
        projectSlug: 'casamento-events-management',
        badge: 'Security',
        date: '2026-10-10',
        description:
            'Enforced constant-time HMAC SHA-256 signature verification and token-bucket rate limiting on all incoming deployment intake endpoints.',
        content: [
            {
                _key: 'wlc-3',
                _type: 'block',
                style: 'normal',
                children: [
                    {
                        _key: 'sp-3',
                        _type: 'span',
                        text: 'Enforced constant-time HMAC SHA-256 signature verification and token-bucket rate limiting on all incoming deployment intake endpoints.',
                    },
                ],
            },
            {
                _key: 'wlc-3-mm',
                _type: 'code',
                language: 'mermaid',
                code: 'sequenceDiagram\n  participant Webhook as Sanity Content Lake\n  participant Route as Next.js /api/revalidate\n  participant Cache as Tag Cache Store\n  Webhook->>Route: POST /api/revalidate (HMAC SHA-256)\n  Route->>Route: crypto.timingSafeEqual()\n  Route->>Cache: revalidateTag("sanity:workLog")\n  Route-->>Webhook: 200 OK (Purged)',
            },
        ],
        commitSha: '4a8b33d',
        developers: ['Benji Cañones', 'Agentic Writer'],
        author: 'Agentic Writer',
        backlinks: [
            {
                _key: 'bl-3',
                platform: 'Security Audit Specs',
                url: 'https://github.com/BenjiBenji20',
            },
        ],
    },
];

export async function getArticlesByProjectSlug(projectSlug: string): Promise<ArticleData[]> {
    'use cache';
    cacheTag('sanity:article', `sanity:articles:${projectSlug}`);
    if (!client) {
        return FALLBACK_ARTICLES.filter(
            (a) => a.projectSlug === projectSlug || !a.projectSlug
        );
    }
    try {
        const data = await client.fetch<ArticleData[] | null>(articlesByProjectSlugQuery, { projectSlug });
        if (data && data.length > 0) {
            return data;
        }
        return FALLBACK_ARTICLES;
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for articles of project ${projectSlug}:`, error);
        return FALLBACK_ARTICLES;
    }
}

export async function getWorkLogsByProjectSlug(projectSlug: string): Promise<WorkLogData[]> {
    'use cache';
    cacheTag('sanity:workLog', `sanity:workLogs:${projectSlug}`);
    if (!client) {
        return FALLBACK_WORK_LOGS.filter(
            (w) => w.projectSlug === projectSlug || !w.projectSlug
        );
    }
    try {
        const data = await client.fetch<WorkLogData[] | null>(workLogsByProjectSlugQuery, { projectSlug });
        if (data && data.length > 0) {
            return data;
        }
        return FALLBACK_WORK_LOGS;
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for work logs of project ${projectSlug}:`, error);
        return FALLBACK_WORK_LOGS;
    }
}

export async function getArticleBySlugs(projectSlug: string, articleSlug?: string): Promise<ArticleData | null> {
    'use cache';
    cacheTag('sanity:article', `sanity:article:${projectSlug}:${articleSlug || 'default'}`);
    if (!client) {
        if (articleSlug) {
            return (
                FALLBACK_ARTICLES.find(
                    (a) => (typeof a.slug === 'string' ? a.slug : a.slug?.current) === articleSlug
                ) || FALLBACK_ARTICLES[0] || null
            );
        }
        return FALLBACK_ARTICLES[0] || null;
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
        return FALLBACK_ARTICLES[0] || null;
    } catch (error) {
        console.warn(`[Sanity Client] Fetch failed for article ${articleSlug} of project ${projectSlug}:`, error);
        return FALLBACK_ARTICLES[0] || null;
    }
}
