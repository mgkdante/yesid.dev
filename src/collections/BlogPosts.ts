import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', 'lang'],
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
    { name: 'excerpt', type: 'textarea', required: true, localized: true, admin: { description: 'Listing-card summary. 1-2 sentences.' } },
    { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    {
      name: 'lang',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { label: 'English',  value: 'en' },
        { label: 'French',   value: 'fr' },
        { label: 'Spanish',  value: 'es' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Professional', value: 'professional' },
        { label: 'Personal',     value: 'personal' },
      ],
    },
    { name: 'tags', type: 'text', hasMany: true, admin: { description: 'Free-string tags (D-rel-3).' } },
    {
      name: 'animation',
      type: 'select',
      defaultValue: 'draw',
      options: [
        { label: 'Draw',     value: 'draw' },
        { label: 'Morph',    value: 'morph' },
        { label: 'Draw-Fill', value: 'draw-fill' },
      ],
    },
    { name: 'svg', type: 'text', admin: { description: 'SVG filename in yesid.dev assets (per Q5, stays as string in 18b).' } },
    { name: 'url', type: 'text', admin: { description: 'Custom override URL. Leave blank to use /blog/<slug>.' } },
    { name: 'external', type: 'checkbox', defaultValue: false },
    { name: 'body', type: 'richText', required: true, localized: true },
  ],
}
