import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'System', useAsTitle: 'filename' },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  upload: {
    imageSizes: [
      { name: 'thumbnail', width: 200, height: 200, position: 'centre' },
      { name: 'card',      width: 600, height: 400, position: 'centre' },
      { name: 'hero',      width: 1200, height: 800, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'alt',     type: 'text', required: true, localized: true },
    { name: 'caption', type: 'text', localized: true },
    { name: 'credit',  type: 'text' },
  ],
}
