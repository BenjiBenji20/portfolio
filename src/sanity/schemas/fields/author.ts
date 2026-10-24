import { defineField } from 'sanity';

export const authorField = defineField({
  name: 'author',
  title: 'Author',
  type: 'string',
  description: 'Internal studio attribution: Agentic Writer vs Human author',
  options: {
    list: [
      { title: 'Agentic Writer', value: 'Agentic Writer' },
      { title: 'Human', value: 'Human' },
    ],
    layout: 'dropdown',
  },
  initialValue: 'Human',
  validation: (Rule) => Rule.required(),
});
