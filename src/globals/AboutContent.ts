import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const AboutContent: GlobalConfig = {
  slug: 'about-content',
  admin: { group: 'Pages', description: '/about page — identity, metrics, methodology, testimonials, stack, interests, weather, client logos, CTA, stop labels.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'identity',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true, localized: true },
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'valueProp', type: 'textarea', required: true, localized: true },
        { name: 'headshot', type: 'text', admin: { description: 'Path to headshot image in /static/. Future: convert to Media relationship.' } },
        {
          name: 'polaroids',
          type: 'array',
          fields: [
            { name: 'src', type: 'text', required: true },
            { name: 'alt', type: 'text', required: true, localized: true },
            { name: 'caption', type: 'text', required: true, localized: true },
            { name: 'rotate', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      name: 'metrics',
      type: 'array',
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'methodology',
      type: 'array',
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'station', type: 'number', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
      ],
    },
    {
      name: 'testimonials',
      type: 'array',
      fields: [
        { name: 'quote', type: 'textarea', required: true, localized: true },
        { name: 'author', type: 'text', required: true },
        { name: 'role', type: 'text', required: true, localized: true },
        { name: 'company', type: 'text', required: true },
      ],
    },
    {
      name: 'techStack',
      type: 'array',
      admin: { description: 'Categorized tech list used on the /about page. Parallel to the `tech-stack` collection but used for a different UI section.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: 'Databases', value: 'databases' },
            { label: 'Languages', value: 'languages' },
            { label: 'Frameworks', value: 'frameworks' },
            { label: 'Tools', value: 'tools' },
          ],
        },
        { name: 'relatedServices', type: 'text', hasMany: true, admin: { description: 'Service IDs this tech applies to. Free-string — not a relationship. Aligns with D-rel-3 tags pattern.' } },
      ],
    },
    {
      name: 'interests',
      type: 'array',
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'image', type: 'text', required: true, admin: { description: 'Path to interest image. Future: convert to Media relationship.' } },
      ],
    },
    {
      name: 'weather',
      type: 'group',
      fields: [
        { name: 'city', type: 'text', required: true, localized: true },
        { name: 'hook', type: 'text', required: true, localized: true },
        { name: 'enabled', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'clientLogos',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'src', type: 'text', required: true, admin: { description: 'Path to logo SVG. Future: convert to Media relationship.' } },
      ],
    },
    { name: 'clientCount', type: 'number', required: true, admin: { description: 'Total client count displayed in the bento.' } },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'command', type: 'text', required: true, admin: { description: 'Terminal-style command string, non-localized for brand consistency.' } },
        {
          name: 'lines',
          type: 'array',
          fields: [
            { name: 'text', type: 'text', required: true },
            {
              name: 'color',
              type: 'select',
              options: [
                { label: 'Orange', value: 'orange' },
                { label: 'Muted', value: 'muted' },
              ],
            },
          ],
        },
        { name: 'buttonLabel', type: 'text', required: true, localized: true },
        { name: 'buttonHref', type: 'text', required: true },
        { name: 'availability', type: 'text', required: true, localized: true },
        {
          name: 'socials',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
            { name: 'icon', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'stopLabels',
      type: 'group',
      admin: { description: '10 ALL-CAPS bento card labels.' },
      fields: [
        { name: 'identity', type: 'text', required: true, localized: true },
        { name: 'metrics', type: 'text', required: true, localized: true },
        { name: 'testimonials', type: 'text', required: true, localized: true },
        { name: 'process', type: 'text', required: true, localized: true },
        { name: 'stack', type: 'text', required: true, localized: true },
        { name: 'clients', type: 'text', required: true, localized: true },
        { name: 'interests', type: 'text', required: true, localized: true },
        { name: 'snapshots', type: 'text', required: true, localized: true },
        { name: 'location', type: 'text', required: true, localized: true },
        { name: 'next', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'labels',
      type: 'group',
      fields: [
        { name: 'clientsServed', type: 'text', required: true, localized: true },
        { name: 'polaroidPrevAria', type: 'text', required: true, localized: true },
        { name: 'polaroidNextAria', type: 'text', required: true, localized: true },
        { name: 'testimonialsCarouselAria', type: 'text', required: true, localized: true },
        { name: 'testimonialsTabNavAria', type: 'text', required: true, localized: true },
        { name: 'testimonialSlideAria', type: 'text', required: true, localized: true },
        { name: 'showTestimonialAria', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
      ],
    },
  ],
}
