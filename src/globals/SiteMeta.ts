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
        {
          name: 'github',
          type: 'text',
          admin: { description: 'Full https URL.' },
          validate: (v: string | null | undefined) => {
            if (v == null || v === '') return true
            return typeof v === 'string' && /^https:\/\//.test(v) ? true : 'Must be a full https URL.'
          },
        },
        {
          name: 'linkedin',
          type: 'text',
          admin: { description: 'Full https URL.' },
          validate: (v: string | null | undefined) => {
            if (v == null || v === '') return true
            return typeof v === 'string' && /^https:\/\//.test(v) ? true : 'Must be a full https URL.'
          },
        },
        {
          name: 'upwork',
          type: 'text',
          admin: { description: 'Full https URL.' },
          validate: (v: string | null | undefined) => {
            if (v == null || v === '') return true
            return typeof v === 'string' && /^https:\/\//.test(v) ? true : 'Must be a full https URL.'
          },
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      admin: { description: 'Footer chrome — tagline line, address line, status prefix. Rendered on every page.' },
      fields: [
        { name: 'tagline', type: 'text', required: true, localized: true, admin: { description: 'Mono decorative line under the wordmark, e.g. "// digital infrastructure".' } },
        { name: 'location', type: 'text', required: true, localized: true, admin: { description: 'Address line with middot separator, e.g. "Montreal, QC · Remote".' } },
        { name: 'statusPrefix', type: 'text', required: true, localized: true, admin: { description: 'Prefix before system date in status bar, e.g. "system online —".' } },
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
