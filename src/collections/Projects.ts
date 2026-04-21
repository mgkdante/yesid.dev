// src/collections/Projects.ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

const httpsUrlValidate = (v: string | null | undefined) =>
  v == null || v.length === 0 || /^https:\/\//.test(v) || 'Must be an https URL'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    group: 'Content',
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'status', 'featured'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'oneLiner', type: 'textarea', required: true, localized: true },
    { name: 'description', type: 'textarea', required: true, localized: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Public',  value: 'public' },
        { label: 'Private', value: 'private' },
        { label: 'WIP',     value: 'wip' },
      ],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'tags', type: 'text', hasMany: true },
    // Source-of-truth relationships (D-rel-1):
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: { description: 'Service offerings this project fulfills. Authors the projects↔services edge.' },
    },
    {
      name: 'stack',
      type: 'relationship',
      relationTo: 'tech-stack',
      hasMany: true,
      admin: { description: 'Tech items this project uses. Authors the projects↔tech-stack edge.' },
    },
    // URLs (Q6 — custom https validator):
    { name: 'repoUrl', type: 'text', validate: httpsUrlValidate },
    { name: 'liveUrl', type: 'text', validate: httpsUrlValidate },
    { name: 'readmeUrl', type: 'text', validate: httpsUrlValidate },
    // Project image as Media relationship (Q4):
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Project cover image. Uploads land in Vercel Blob.' },
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
    // Single impact metric for home/listing card (services-grid variant):
    {
      name: 'impactMetric',
      type: 'group',
      fields: [
        { name: 'value', type: 'text', admin: { description: 'e.g. "3x faster"' } },
        { name: 'label', type: 'text', localized: true, admin: { description: 'e.g. "avg query improvement"' } },
        { name: 'before', type: 'text', admin: { description: 'Optional "before" value for comparison displays.' } },
      ],
    },
    // Multiple metrics for detail-page glance panel:
    {
      name: 'impactMetrics',
      type: 'array',
      labels: { singular: 'Impact Metric', plural: 'Impact Metrics' },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'before', type: 'text' },
      ],
    },
    { name: 'location', type: 'text' },
    { name: 'environment', type: 'text' },
    { name: 'version', type: 'text' },
  ],
}
