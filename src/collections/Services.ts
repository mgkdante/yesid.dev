// src/collections/Services.ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

const httpsUrlValidate = (v: string | null | undefined) =>
  v == null || v.length === 0 || /^https:\/\//.test(v) || 'Must be an https URL'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    group: 'Content',
    useAsTitle: 'id',
    defaultColumns: ['id', 'station', 'visible'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'id', type: 'text', required: true, unique: true, index: true, admin: { description: 'Stable slug id, e.g. "sql-development".' } },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'description', type: 'textarea', required: true, localized: true },
    { name: 'longDescription', type: 'textarea', localized: true },
    { name: 'valueProposition', type: 'textarea', localized: true },
    { name: 'station', type: 'number', required: true },
    { name: 'icon', type: 'text', admin: { description: 'Lottie/icon filename (kept as string per Q3).' } },
    { name: 'svg', type: 'text', admin: { description: 'SVG filename (kept as string per Q3).' } },
    { name: 'lottieReverse', type: 'checkbox', defaultValue: false },
    { name: 'visible', type: 'checkbox', defaultValue: true },
    {
      name: 'deliverables',
      type: 'array',
      localized: true,
      labels: { singular: 'Deliverable', plural: 'Deliverables' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'sections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'content', type: 'textarea', required: true, localized: true },
      ],
    },
    { name: 'benefitHeadline', type: 'text', localized: true },
    {
      name: 'impactMetric',
      type: 'group',
      fields: [
        { name: 'value', type: 'text', localized: true },
        { name: 'label', type: 'text', localized: true },
      ],
    },
    // Source of truth for tech relationships (D-rel-1):
    {
      name: 'stack',
      type: 'relationship',
      relationTo: 'tech-stack',
      hasMany: true,
    },
    // TODO(18b-4): uncomment after projects collection exists
    // Reverse-join from projects.services (D-rel-1):
    // {
    //   name: 'relatedProjects',
    //   type: 'join',
    //   collection: 'projects',
    //   on: 'services',
    //   admin: { description: 'Auto-computed from project.services; edit on the Projects side.' },
    // },
  ],
}
