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
