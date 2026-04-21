import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const TechStackPage: GlobalConfig = {
  slug: 'tech-stack-page',
  admin: {
    group: 'Pages',
    description: '/tech-stack page copy — hero, stats, CTA, meta.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'meta',
      type: 'group',
      admin: { description: 'HTML <title> + <meta description> for /tech-stack.' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          admin: {
            description: 'Template with {itemCount} + {layerCount} placeholders.',
          },
        },
      ],
    },
    {
      name: 'hero',
      type: 'group',
      admin: {
        description: 'Hero section — overline, title lines, terminal aria, stat labels.',
      },
      fields: [
        { name: 'overline', type: 'text', required: true, localized: true },
        {
          name: 'titleLine1',
          type: 'text',
          required: true,
          localized: true,
          admin: { description: 'H1 line 1 — before the <br> break.' },
        },
        {
          name: 'titleLine2',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'H1 line 2 — inside the .hero-title-accent span. Trailing "." stays as a literal in the template.',
          },
        },
        { name: 'terminalAria', type: 'text', required: true, localized: true },
        {
          name: 'stats',
          type: 'group',
          admin: { description: 'Stat labels beneath the count numbers.' },
          fields: [
            { name: 'technologies', type: 'text', required: true, localized: true },
            { name: 'layers', type: 'text', required: true, localized: true },
            { name: 'domains', type: 'text', required: true, localized: true },
            { name: 'projects', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
    {
      name: 'actions',
      type: 'group',
      admin: {
        description: 'Shared CTA button labels — rendered in both the hero bottom and CTA zone.',
      },
      fields: [
        { name: 'getInTouch', type: 'text', required: true, localized: true },
        { name: 'viewServices', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      admin: { description: 'Footer CTA zone — heading lines, sub-copy, availability label.' },
      fields: [
        {
          name: 'headingLine1',
          type: 'text',
          required: true,
          localized: true,
          admin: { description: 'H2 line 1. Trailing "?" accent stays as a literal span.' },
        },
        {
          name: 'headingLine2',
          type: 'text',
          required: true,
          localized: true,
          admin: { description: 'H2 line 2. Trailing "." accent stays as a literal span.' },
        },
        { name: 'sub', type: 'textarea', required: true, localized: true },
        { name: 'availability', type: 'text', required: true, localized: true },
      ],
    },
  ],
}
