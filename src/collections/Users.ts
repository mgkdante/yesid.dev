import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'System',
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },
  access: {
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['admin'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}
