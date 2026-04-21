import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const SiteMeta: GlobalConfig = {
  slug: 'site-meta',
  admin: {
    description:
      'Site-wide metadata. Heartbeat in Slice 18a (siteName, deployedAt); extended in 18b with tagline, description, links.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'yesid.dev',
    },
    {
      name: 'deployedAt',
      type: 'text',
      admin: {
        description: 'Auto-set by beforeChange hook on every save; ISO timestamp.',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => ({ ...data, deployedAt: new Date().toISOString() }),
    ],
  },
}
