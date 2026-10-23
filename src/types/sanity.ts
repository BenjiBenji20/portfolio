export interface SanityImageReference {
  _type?: 'image';
  asset?: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}

export interface ProfileStatus {
  isAvailable: boolean;
  statusMessage?: string;
  icon?: SanityImageReference;
}

export interface Affiliation {
  role?: string;
  company?: string;
  url?: string;
}

export interface Education {
  degree?: string;
  institution?: string;
  period?: string;
}

export interface Certification {
  title: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  email?: string;
  website?: string;
}

export interface ProfileData {
  _id?: string;
  fullName: string;
  headline: string;
  motto?: string;
  avatar?: SanityImageReference;
  status: ProfileStatus;
  currentAffiliation?: Affiliation;
  location?: string;
  education?: Education;
  certifications?: Certification[];
  socialLinks?: SocialLinks;
  featuredSkills?: string[];
}

export interface NavRoute {
  label: string;
  href: string;
}

export interface PortableTextChild {
  _key?: string;
  _type?: string;
  text: string;
  marks?: string[];
}

export interface PortableTextParagraph {
  _key?: string;
  _type: 'block';
  children: PortableTextChild[];
  markDefs?: { _key: string; _type: string }[];
  style?: string;
}

export interface SummaryOverviewData {
  _id?: string;
  summaryText?: PortableTextParagraph[];
}

export interface FocusPillar {
  _id?: string;
  _key?: string;
  title: string;
  description: string;
  icon?: SanityImageReference;
  order?: number;
}
export type FocusField = FocusPillar;

export interface Experience {
  _id?: string;
  _key?: string;
  position: string;
  employer: string;
  employmentRange: string;
  mainDescription: string;
  accomplishments?: string[];
  isCurrent?: boolean;
  order?: number;
}
export type ExperienceItem = Experience;

export interface OverviewData {
  _id?: string;
  summaryText?: PortableTextParagraph[];
  focusFields: FocusPillar[];
  experiences: Experience[];
}

export type ProjectStatus = 'production' | 'development' | 'completed' | 'archived';

export interface ProjectCollaborator {
  name: string;
  role?: string;
  url?: string;
}

export type ProjectMediaType =
  | 'projectMediaImage'
  | 'projectMediaSanityVideo'
  | 'projectMediaYoutube'
  | 'projectMediaVimeo';

export interface ProjectMediaImageItem {
  _key: string;
  _type: 'projectMediaImage';
  asset?: {
    _ref?: string;
    _id?: string;
    url?: string;
  };
  alt?: string;
  caption?: string;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}

export interface ProjectMediaSanityVideoItem {
  _key: string;
  _type: 'projectMediaSanityVideo';
  asset?: {
    _ref?: string;
    _id?: string;
    url?: string;
    mimeType?: string;
    size?: number;
  };
  title?: string;
  poster?: SanityImageReference;
  caption?: string;
}

export interface ProjectMediaYouTubeItem {
  _key: string;
  _type: 'projectMediaYoutube';
  url: string;
  title?: string;
  poster?: SanityImageReference;
  caption?: string;
}

export interface ProjectMediaVimeoItem {
  _key: string;
  _type: 'projectMediaVimeo';
  url: string;
  title?: string;
  poster?: SanityImageReference;
  caption?: string;
}

export type ProjectMediaItem =
  | ProjectMediaImageItem
  | ProjectMediaSanityVideoItem
  | ProjectMediaYouTubeItem
  | ProjectMediaVimeoItem;

export interface ProjectData {
  _id?: string;
  title: string;
  slug: { current: string } | string;
  shortDescription: string;
  projectType?: string; // RAG, Public Site, AI, Automation, SaaS
  employer?: string;
  collaborators?: ProjectCollaborator[];
  logo?: SanityImageReference;
  media?: ProjectMediaItem[];
  website?: string;
  repository?: string;
  techStacks?: string[];
  status: ProjectStatus;
  dateStarted?: string;
  dateFinished?: string;
  featured: boolean;
  hidden: boolean;
  priorityValue: number;
}

export interface ContactChannel {
  _key?: string;
  platform: string;
  handle: string;
  link: string;
  icon?: SanityImageReference;
}

export interface EmailContactInquiryTemplateData {
  _id?: string;
  dispatchType?: string;
  icon?: SanityImageReference;
  subjectPrefix?: string;
  headline?: string;
  footerNote?: string;
}

// Deprecated alias for backwards compatibility
export type EmailTemplateConfig = EmailContactInquiryTemplateData;

export interface ContactData {
  _id?: string;
  header: string;
  shortDescription: string;
  followUp: string;
  contacts: ContactChannel[];
  subjects: string[];
}

