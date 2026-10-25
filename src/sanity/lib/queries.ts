export const profileQuery = `*[_type == "profile"][0]{
  _id,
  fullName,
  headline,
  motto,
  avatar {
    asset->{
      _id,
      url
    },
    alt,
    hotspot
  },
  status {
    isAvailable,
    statusMessage,
    icon {
      asset->{
        _id,
        url
      },
      alt,
      hotspot
    }
  },
  currentAffiliation {
    role,
    company,
    url
  },
  location,
  education {
    degree,
    institution,
    period
  },
  certifications[] {
    title,
    issuer,
    date,
    url
  },
  socialLinks {
    github,
    linkedin,
    email,
    website
  },
  featuredSkills
}`;

export const summaryOverviewQuery = `*[_type == "summaryOverview"][0]{
  _id,
  summaryText
}`;

export const focusPillarsQuery = `*[_type == "focusPillar"] | order(order asc, _createdAt asc)[0...3]{
  _id,
  title,
  description,
  icon {
    asset->{ _id, url },
    alt,
    hotspot
  },
  order
}`;

export const experiencesQuery = `*[_type == "experience"] | order(order asc, _createdAt desc){
  _id,
  position,
  employer,
  employmentRange,
  mainDescription,
  accomplishments,
  isCurrent,
  order
}`;

export const featuredProjectsQuery = `*[_type == "project" && featured == true && hidden != true] | order(priorityValue desc, _createdAt desc)[0...4]{
  _id,
  title,
  slug,
  shortDescription,
  projectType,
  employer,
  organization,
  collaborators[] {
    name,
    role,
    url
  },
  logo {
    asset->{ _id, url },
    alt,
    hotspot
  },
  media[] {
    _key,
    _type,
    alt,
    title,
    caption,
    url,
    hotspot,
    asset->{
      _id,
      url,
      mimeType,
      size
    },
    poster {
      asset->{ _id, url },
      alt,
      hotspot
    }
  },
  website,
  repository,
  techStacks,
  status,
  dateStarted,
  dateFinished,
  featured,
  hidden,
  priorityValue,
  author
}`;

export const allProjectsQuery = `*[_type == "project" && hidden != true] | order(priorityValue desc, dateStarted desc, _createdAt desc){
  _id,
  title,
  slug,
  shortDescription,
  projectType,
  employer,
  organization,
  collaborators[] {
    name,
    role,
    url
  },
  logo {
    asset->{ _id, url },
    alt,
    hotspot
  },
  media[] {
    _key,
    _type,
    alt,
    title,
    caption,
    url,
    hotspot,
    asset->{
      _id,
      url,
      mimeType,
      size
    },
    poster {
      asset->{ _id, url },
      alt,
      hotspot
    }
  },
  website,
  repository,
  techStacks,
  status,
  dateStarted,
  dateFinished,
  featured,
  hidden,
  priorityValue,
  author
}`;

export const contactQuery = `*[_type == "contact"][0]{
  _id,
  header,
  shortDescription,
  followUp,
  contacts[] {
    _key,
    platform,
    handle,
    link,
    icon {
      asset->{ _id, url },
      alt
    }
  },
  subjects
}`;

export const emailContactInquiryTemplateQuery = `*[_type == "emailContactInquiryTemplate"][0]{
  _id,
  dispatchType,
  icon {
    asset->{ _id, url },
    alt
  },
  subjectPrefix,
  headline,
  footerNote
}`;

export const blogQuery = `*[_type == "blog"][0]{
  _id,
  title,
  publishedAt,
  lastUpdated,
  readTime,
  content[] {
    ...,
    _type == "projectMediaImage" => {
      ...,
      asset->{
        _id,
        url
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    },
    _type == "projectMediaSanityVideo" => {
      ...,
      asset->{
        _id,
        url,
        mimeType,
        size
      },
      poster {
        asset->{ _id, url }
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    },
    _type == "projectMediaYoutube" => {
      ...,
      poster {
        asset->{ _id, url }
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    },
    _type == "projectMediaVimeo" => {
      ...,
      poster {
        asset->{ _id, url }
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    }
  }
}`;

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  shortDescription,
  projectType,
  employer,
  organization,
  collaborators[] {
    name,
    role,
    url
  },
  logo {
    asset->{ _id, url },
    alt,
    hotspot
  },
  media[] {
    _key,
    _type,
    alt,
    title,
    caption,
    url,
    hotspot,
    asset->{
      _id,
      url,
      mimeType,
      size
    },
    poster {
      asset->{ _id, url },
      alt,
      hotspot
    }
  },
  website,
  repository,
  techStacks,
  status,
  dateStarted,
  dateFinished,
  featured,
  hidden,
  priorityValue,
  author,
  content[] {
    ...,
    _type == "projectMediaImage" => {
      ...,
      asset->{
        _id,
        url
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    },
    _type == "projectMediaSanityVideo" => {
      ...,
      asset->{
        _id,
        url,
        mimeType,
        size
      },
      poster {
        asset->{ _id, url }
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    },
    _type == "projectMediaYoutube" => {
      ...,
      poster {
        asset->{ _id, url }
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    },
    _type == "projectMediaVimeo" => {
      ...,
      poster {
        asset->{ _id, url }
      },
      backlinks[] {
        _key,
        platform,
        url,
        icon {
          asset->{ _id, url }
        }
      }
    }
  }
}`;

export const articlesByProjectSlugQuery = `*[_type == "article" && (project->slug.current == $projectSlug || projectSlug == $projectSlug) && hidden != true] | order(priorityValue desc, publishedAt desc, _createdAt desc){
  _id,
  title,
  slug,
  "projectSlug": coalesce(project->slug.current, projectSlug),
  excerpt,
  coverImage {
    asset->{ _id, url },
    alt,
    hotspot
  },
  publishedAt,
  readTime,
  priorityValue,
  author,
  developers
}`;

export const workLogsByProjectSlugQuery = `*[_type == "workLog" && (project->slug.current == $projectSlug || projectSlug == $projectSlug)] | order(date desc, _createdAt desc){
  _id,
  title,
  "projectSlug": coalesce(project->slug.current, projectSlug),
  badge,
  date,
  description,
  content[] {
    ...,
    _type == "projectMediaImage" => {
      ...,
      asset->{
        _id,
        url,
        mimeType,
        size
      }
    },
    _type == "projectMediaSanityVideo" => {
      ...,
      asset->{
        _id,
        url,
        mimeType,
        size
      },
      poster {
        asset->{ _id, url },
        alt
      }
    },
    _type == "projectMediaYoutube" => {
      ...,
      poster {
        asset->{ _id, url },
        alt
      }
    },
    _type == "projectMediaVimeo" => {
      ...,
      poster {
        asset->{ _id, url },
        alt
      }
    }
  },
  commitSha,
  developers,
  backlinks[] {
    _key,
    platform,
    url,
    icon {
      asset->{ _id, url },
      alt
    }
  },
  author
}`;

export const articleBySlugsQuery = `*[_type == "article" && (project->slug.current == $projectSlug || projectSlug == $projectSlug) && slug.current == $articleSlug && hidden != true][0]{
  _id,
  title,
  slug,
  "projectSlug": coalesce(project->slug.current, projectSlug),
  excerpt,
  coverImage {
    asset->{ _id, url },
    alt,
    hotspot
  },
  publishedAt,
  readTime,
  priorityValue,
  author,
  developers,
  content
}`;

