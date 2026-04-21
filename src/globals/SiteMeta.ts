import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const SiteMeta: GlobalConfig = {
  slug: 'site-meta',
  admin: {
    group: 'Pages',
    description: 'Site-wide metadata — brand name, tagline, description, and social/outreach links.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'yesid.' },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'description', type: 'text', localized: true, admin: { description: 'Used for <meta name="description">. Keep under 160 chars for SEO.' } },
    {
      name: 'links',
      type: 'group',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'github', type: 'text', admin: { description: 'Full https URL.' } },
        { name: 'linkedin', type: 'text', admin: { description: 'Full https URL.' } },
        { name: 'upwork', type: 'text', admin: { description: 'Full https URL.' } },
      ],
    },
    {
      name: 'deployedAt',
      type: 'text',
      admin: { readOnly: true, description: 'Auto-set by beforeChange hook on every save; ISO timestamp.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => ({ ...data, deployedAt: new Date().toISOString() }),
    ],
  },
}
