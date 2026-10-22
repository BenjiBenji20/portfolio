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
