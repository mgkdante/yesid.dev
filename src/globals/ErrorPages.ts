import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const ErrorPages: GlobalConfig = {
  slug: 'error-pages',
  admin: { group: 'Pages', description: '404 and other error page copy.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'notFound',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'heading', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
        {
          name: 'terminalLine',
          type: 'text',
          required: true,
          admin: { description: 'Terminal-style status line. Not localized — identical across locales.' },
        },
        {
          name: 'suggestions',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}
