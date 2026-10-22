import { defineType, defineField } from 'sanity';

export const profileType = defineType({
  name: 'profile',
  title: 'Profile (sidebar)',
  type: 'document',
  fields: [
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: (rule) => rule.required(),
      initialValue: 'Benji I. Cañones',
    }),
    defineField({
      name: 'headline',
      title: 'Headline / Role',
      type: 'string',
      validation: (rule) => rule.required(),
      initialValue: 'Junior Backend Developer',
    }),
    defineField({
      name: 'motto',
      title: 'Motto / Tagline',
      type: 'string',
      description: 'Concise 1-2 line motto (maximum 120 characters)',
      validation: (rule) => rule.max(120).warning('Keep motto under 120 characters for compact display'),
      initialValue: 'Crafting robust RAG systems, scalable backend architectures, and AI integrations.',
    }),
    defineField({
      name: 'avatar',
      title: 'Profile Avatar',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          initialValue: 'Benji I. Cañones profile photo',
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Current Status',
      type: 'object',
      fields: [
        defineField({
          name: 'isAvailable',
          title: 'Available for Hire/Work',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'statusMessage',
          title: 'Status Message',
          type: 'string',
          initialValue: 'Open to engineering opportunities',
        }),
      ],
    }),
    defineField({
      name: 'currentAffiliation',
      title: 'Current Company / Affiliation',
      type: 'object',
      fields: [
        defineField({
          name: 'role',
          title: 'Role',
          type: 'string',
          initialValue: 'Freelance Software Engineer',
        }),
        defineField({
          name: 'company',
          title: 'Company Name',
          type: 'string',
          initialValue: 'Casamento Events Management',
        }),
        defineField({
          name: 'url',
          title: 'Website URL',
          type: 'url',
        }),
      ],
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      initialValue: 'Malabon, NCR, Philippines',
    }),
    defineField({
      name: 'education',
      title: 'Education',
      type: 'object',
      fields: [
        defineField({
          name: 'degree',
          title: 'Degree',
          type: 'string',
          initialValue: 'BS in Information Technology',
        }),
        defineField({
          name: 'institution',
          title: 'Institution',
          type: 'string',
          initialValue: 'City of Malabon University',
        }),
        defineField({
          name: 'period',
          title: 'Period',
          type: 'string',
          initialValue: '2022 - 2026',
        }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social & External Links',
      type: 'object',
      fields: [
        defineField({
          name: 'github',
          title: 'GitHub URL',
          type: 'url',
          initialValue: 'https://github.com/BenjiBenji20',
        }),
        defineField({
          name: 'linkedin',
          title: 'LinkedIn URL',
          type: 'url',
          initialValue: 'https://linkedin.com/in/benji-cañones',
        }),
        defineField({
          name: 'email',
          title: 'Contact Email',
          type: 'string',
          initialValue: 'benjicanones6@gmail.com',
        }),
        defineField({
          name: 'website',
          title: 'Personal Website URL',
          type: 'url',
          initialValue: 'https://benjineer.vercel.app',
        }),
      ],
    }),
    defineField({
      name: 'featuredSkills',
      title: 'Featured Sidebar Skill Chips',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: ['Python', 'FastAPI', 'TypeScript', 'PostgreSQL', 'Qdrant', 'GCP'],
    }),
  ],
});
