import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const StackScenarios: CollectionConfig = {
  slug: 'stack-scenarios',
  admin: {
    group: 'Content',
    useAsTitle: 'id',
    defaultColumns: ['id', 'domains'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeChange: [
          ({ operation, siblingData }) => {
            if (operation === 'update') {
              delete siblingData.id
            }
          },
        ],
      },
      admin: { description: 'Stable scenario id, e.g. "analytics-dashboard".' },
    },
    {
      name: 'domains',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Data Engineering',    value: 'data-engineering' },
        { label: 'Web Development',     value: 'web-development' },
        { label: 'Mobile Development',  value: 'mobile-development' },
        { label: 'Analytics / BI',      value: 'analytics-bi' },
        { label: 'Systems Programming', value: 'systems-programming' },
        { label: 'DevOps / Infra',      value: 'devops-infra' },
        { label: 'Internal Tooling',    value: 'internal-tooling' },
      ],
    },
    {
      name: 'techs',  // renamed from TS 'recommended' per Q7
      type: 'relationship',
      relationTo: 'tech-stack',
      hasMany: true,
      required: true,
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
    },
    { name: 'summary', type: 'textarea', required: true, localized: true },
  ],
}
