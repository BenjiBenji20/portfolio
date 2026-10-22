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
    statusMessage
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
  socialLinks {
    github,
    linkedin,
    email,
    website
  },
  featuredSkills
}`;
