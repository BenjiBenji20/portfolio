import { defineField, defineType } from 'sanity';

export const emailContactInquiryTemplateType = defineType({
  name: 'emailContactInquiryTemplate',
  title: 'Email Contact Inquiry Template',
  type: 'document',
  fields: [
    defineField({
      name: 'dispatchType',
      title: 'Dispatch Type',
      type: 'string',
      description: 'Category label displayed on the inbound email badge (e.g. Visitor Contact Email, AI System Alert)',
      initialValue: 'Visitor Contact Email',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Template Icon',
      type: 'image',
      description: 'Optional logo or avatar displayed alongside the dispatch header',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'subjectPrefix',
      title: 'Subject Line Prefix',
      type: 'string',
      description: 'Prefix tag prepended to the email subject line (e.g., "[Portfolio Contact]")',
      initialValue: '[Portfolio Contact]',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Email Headline Banner',
      type: 'string',
      description: 'Primary banner heading displayed at the top of the inbound email card',
      initialValue: 'New Inquiry from Portfolio Contact Form',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'footerNote',
      title: 'Email Footer Note',
      type: 'text',
      rows: 3,
      description: 'Closing disclaimer or response instructions shown at the bottom of the email',
      initialValue:
        'Dispatched securely via Benjineer Portfolio. Reply directly to this email to respond.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      subtitle: 'dispatchType',
      media: 'icon',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Email Contact Inquiry Template',
        subtitle: subtitle || 'Visitor Contact Email',
        media,
      };
    },
  },
});
