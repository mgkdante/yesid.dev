// src/collections/Services.ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

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
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeChange: [
          ({ operation, siblingData, originalDoc }) => {
            if (operation === 'update' && originalDoc?.id != null) {
              // Silent-override: preserve the original id regardless of what the
              // caller submits. Blocks API-level renames while keeping the field
              // present for Payload's `required: true` validator.
              siblingData.id = originalDoc.id
            }
          },
        ],
      },
      admin: { description: 'Stable slug id, e.g. "sql-development".' },
    },
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
    // Reverse-join from projects.services (D-rel-1):
    {
      name: 'relatedProjects',
      type: 'join',
      collection: 'projects',
      on: 'services',
      admin: { description: 'Auto-computed from project.services; edit on the Projects side.' },
    },
  ],
}
