import { defineField, defineType } from 'sanity';

export const contactType = defineType({
  name: 'contact',
  title: 'Contact Section',
  type: 'document',
  fields: [
    defineField({
      name: 'header',
      title: 'Header Title',
      type: 'string',
      initialValue: "Let's connect!",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      initialValue:
        "Let's build high-impact systems starts with a conversation. Currently Open for Junior Roles.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'followUp',
      title: 'Socials Divider Text',
      type: 'string',
      initialValue: 'or message me in my other socials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contacts',
      title: 'Contact Channels & Socials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform Name',
              type: 'string',
              placeholder: 'Email, GitHub, LinkedIn, Viber...',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'handle',
              title: 'Display Handle / Label',
              type: 'string',
              placeholder: 'e.g. benjicanones6@gmail.com, BenjiBenji20...',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'link',
              title: 'URL / Action Link',
              type: 'string',
              placeholder: 'mailto:..., https://..., tel:...',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Custom Platform Icon',
              type: 'image',
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'handle',
              media: 'icon',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'subjects',
      title: 'Email Subject Quick-Pills',
      type: 'array',
      description: 'Pills that users can click to pre-fill or append the message subject',
      of: [{ type: 'string' }],
      initialValue: [
        'Job Opportunity',
        'Technical Inquiry',
        'Just saying hi!',
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Contact Section',
        subtitle: 'Global contact details, social links, and email form subjects',
      };
    },
  },
});
