import type {
  ContactData,
  EmailContactInquiryTemplateData,
  Experience,
  FocusPillar,
  ProfileData,
  SummaryOverviewData,
} from '../../types/sanity';

export const DEFAULT_PROFILE: ProfileData = {
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

export const DEFAULT_SUMMARY_OVERVIEW: SummaryOverviewData = {
  summaryText: [
    {
      _key: 'summary-p1',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: 'c1',
          _type: 'span',
          marks: [],
          text: 'Junior Backend Developer with hands-on experience architecting production-ready ',
        },
        {
          _key: 'c2',
          _type: 'span',
          marks: ['strong'],
          text: 'RAG systems',
        },
        {
          _key: 'c3',
          _type: 'span',
          marks: [],
          text: ', full-stack web applications, and performing technical security assessments. Focused on scalable APIs, vector database partitioning, and autonomous agent workflows.',
        },
      ],
    },
  ],
};

export const DEFAULT_FOCUS_PILLARS: FocusPillar[] = [
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

export const DEFAULT_EXPERIENCES: Experience[] = [
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

export const DEFAULT_CONTACT: ContactData = {
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

export const DEFAULT_EMAIL_INQUIRY_TEMPLATE: EmailContactInquiryTemplateData = {
  dispatchType: 'Visitor Contact Email',
  subjectPrefix: '[Portfolio Contact]',
  headline: 'New Inquiry from Portfolio Contact Form',
  footerNote:
    'Dispatched securely via Benjineer Portfolio. Reply directly to this email to respond.',
};

