// src/collections/TechStack.ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const TechStack: CollectionConfig = {
  slug: 'tech-stack',
  admin: { group: 'Content', useAsTitle: 'name', defaultColumns: ['name', 'layer', 'proficiency'] },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'id', type: 'text', required: true, unique: true, admin: { description: 'Stable slug id, e.g. "postgresql". Matches yesid.dev tech IDs.' } },
    { name: 'name', type: 'text', required: true },
    {
      name: 'layer',
      type: 'select',
      required: true,
      options: [
        { label: 'Data',      value: 'data' },
        { label: 'Backend',   value: 'backend' },
        { label: 'API',       value: 'api' },
        { label: 'Frontend',  value: 'frontend' },
        { label: 'Mobile',    value: 'mobile' },
        { label: 'Analytics', value: 'analytics' },
        { label: 'DevOps',    value: 'devops' },
        { label: 'Testing',   value: 'testing' },
        { label: 'Systems',   value: 'systems' },
      ],
    },
    {
      name: 'domains',
      type: 'select',
      hasMany: true,
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
    { name: 'icon', type: 'text', admin: { description: 'Icon slug matching yesid.dev icon registry.' } },
    {
      name: 'proficiency',
      type: 'select',
      options: [
        { label: 'Expert',     value: 'expert' },
        { label: 'Proficient', value: 'proficient' },
        { label: 'Familiar',   value: 'familiar' },
      ],
    },
    // Reverse-edge join fields (D-rel-1) — auto-computed, read-only:
    // TODO(18b-4): uncomment after projects + services collections exist
    // { name: 'relatedProjects', type: 'join', collection: 'projects', on: 'stack', admin: { readOnly: true } },
    // { name: 'relatedServices', type: 'join', collection: 'services', on: 'stack', admin: { readOnly: true } },
  ],
}
