import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const HomeContent: GlobalConfig = {
  slug: 'home-content',
  admin: { group: 'Pages', description: 'Home page — hero, manifesto, journey, proof reel, services grid, closer.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    // ── heroAnim ──────────────────────────────────────────────────────────────
    {
      name: 'heroAnim',
      type: 'group',
      fields: [
        { name: 'scrollDown', type: 'text', required: true, localized: true },
      ],
    },

    // ── hero ─────────────────────────────────────────────────────────────────
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'headline',
          type: 'group',
          fields: [
            { name: 'line1', type: 'text', required: true, localized: true },
            { name: 'line2', type: 'text', required: true, localized: true },
            { name: 'ariaSuffix', type: 'text', required: true, localized: true, admin: { description: 'Aria-label suffix so assistive tech hears the full headline.' } },
          ],
        },
        { name: 'subheadline', type: 'text', required: true, localized: true },
        { name: 'subtitle', type: 'textarea', required: true, localized: true },
        { name: 'ctaWork', type: 'text', required: true, localized: true },
        { name: 'ctaContact', type: 'text', required: true, localized: true },
        {
          name: 'sqlPanel',
          type: 'group',
          fields: [
            { name: 'prompt', type: 'text', required: true, localized: true },
            { name: 'liveLabel', type: 'text', required: true, localized: true },
            {
              name: 'columns',
              type: 'group',
              fields: [
                { name: 'route', type: 'text', required: true, localized: true },
                { name: 'avgDelayS', type: 'text', required: true, localized: true },
                { name: 'vehicles', type: 'text', required: true, localized: true },
              ],
            },
            { name: 'metaTemplate', type: 'text', required: true, localized: true, admin: { description: 'Template with {queryTime} and {updatedAgo} placeholders.' } },
          ],
        },
        {
          name: 'refreshButton',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'helper', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },

    // ── manifesto ─────────────────────────────────────────────────────────────
    {
      name: 'manifesto',
      type: 'group',
      fields: [
        {
          name: 'statement',
          type: 'group',
          fields: [
            { name: 'line1', type: 'text', required: true, localized: true },
            { name: 'lineHuge', type: 'text', required: true, localized: true },
            { name: 'line3Part1', type: 'text', required: true, localized: true },
            { name: 'line3Highlight', type: 'text', required: true, localized: true },
            { name: 'line3Part2', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'terminal',
          type: 'group',
          fields: [
            { name: 'user', type: 'text', required: true, localized: true },
            { name: 'command', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'pills',
          type: 'array',
          labels: { singular: 'Pill', plural: 'Pills' },
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'serviceId', type: 'text', required: true, admin: { description: 'Service slug — not a relationship (free string, D-rel-3).' } },
          ],
        },
        {
          name: 'edgeLeft',
          type: 'group',
          fields: [
            { name: 'sectionNumber', type: 'text', required: true, localized: true },
            { name: 'sectionName', type: 'text', required: true, localized: true },
            { name: 'location', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'edgeRight',
          type: 'group',
          fields: [
            { name: 'lat', type: 'text', required: true, localized: true },
            { name: 'lng', type: 'text', required: true, localized: true },
            { name: 'src', type: 'text', required: true, localized: true },
            { name: 'via', type: 'text', required: true, localized: true },
            { name: 'dst', type: 'text', required: true, localized: true },
            { name: 'node', type: 'text', required: true, localized: true },
            { name: 'status', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'edgeBottom',
          type: 'group',
          fields: [
            { name: 'connected', type: 'text', required: true, localized: true },
            { name: 'line', type: 'text', required: true, localized: true },
            { name: 'url', type: 'text', required: true, localized: true },
            { name: 'version', type: 'text', required: true, localized: true },
            { name: 'scrollHint', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'transit',
          type: 'group',
          fields: [
            { name: 'arrivalLabel', type: 'text', required: true, localized: true },
            { name: 'platformBadge', type: 'text', required: true, localized: true },
            { name: 'directionBadge', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'hiddenTransitLines',
          type: 'array',
          admin: { description: 'Hidden decorative transit lines rendered in the manifesto background.' },
          labels: { singular: 'Transit Line', plural: 'Transit Lines' },
          fields: [
            { name: 'name', type: 'text', required: true, localized: true },
            { name: 'color', type: 'text', required: true, admin: { description: 'Hex color code.' } },
          ],
        },
      ],
    },

    // ── journey (skills journey panels) ──────────────────────────────────────
    {
      name: 'journey',
      type: 'array',
      admin: { description: 'Horizontal skills journey panels — each is a metro stop.' },
      labels: { singular: 'Journey Panel', plural: 'Journey Panels' },
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'text', type: 'text', required: true, localized: true },
        {
          name: 'highlightWords',
          type: 'text',
          hasMany: true,
          admin: { description: 'Words within `text` that receive the highlight animation.' },
        },
        {
          name: 'highlightEffect',
          type: 'select',
          required: true,
          options: [
            { label: 'Scale', value: 'scale' },
            { label: 'Gradient', value: 'gradient' },
            { label: 'Wave', value: 'wave' },
            { label: 'Char Reveal', value: 'charReveal' },
          ],
        },
        {
          name: 'skills',
          type: 'array',
          labels: { singular: 'Skill', plural: 'Skills' },
          fields: [
            { name: 'id', type: 'text', required: true },
            { name: 'name', type: 'text', required: true },
            { name: 'subtitle', type: 'text' },
            {
              name: 'icon',
              type: 'select',
              required: true,
              options: [
                { label: 'SQL', value: 'sql' },
                { label: 'TypeScript', value: 'typescript' },
                { label: 'Python', value: 'python' },
                { label: 'SvelteKit', value: 'sveltekit' },
                { label: 'GSAP', value: 'gsap' },
                { label: 'Power BI', value: 'powerbi' },
                { label: 'Docker', value: 'docker' },
              ],
            },
          ],
        },
      ],
    },

    // ── journeyCta ────────────────────────────────────────────────────────────
    {
      name: 'journeyCta',
      type: 'group',
      admin: { description: 'CTA shown at the end of the skills journey strip.' },
      fields: [
        { name: 'prompt', type: 'text', required: true, localized: true },
        { name: 'button', type: 'text', required: true, localized: true },
      ],
    },

    // ── proofReel ─────────────────────────────────────────────────────────────
    {
      name: 'proofReel',
      type: 'group',
      admin: { description: 'Proof / selected work reel section copy.' },
      fields: [
        { name: 'heading', type: 'text', required: true, localized: true },
        { name: 'headingDot', type: 'text', required: true, localized: true },
        { name: 'subheading', type: 'text', required: true, localized: true },
        { name: 'sectionLabel', type: 'text', required: true, localized: true },
        { name: 'viewAllLabel', type: 'text', required: true, localized: true },
        { name: 'viewAllHref', type: 'text', required: true },
        { name: 'toggleColorAria', type: 'text', required: true, localized: true, admin: { description: 'Template with {title} placeholder.' } },
      ],
    },

    // ── servicesGrid ──────────────────────────────────────────────────────────
    {
      name: 'servicesGrid',
      type: 'group',
      admin: { description: 'Home-page services overview section copy.' },
      fields: [
        { name: 'heading', type: 'text', required: true, localized: true },
        { name: 'headingDot', type: 'text', required: true, localized: true },
        { name: 'subheading', type: 'text', required: true, localized: true },
        { name: 'viewIllustrationAria', type: 'text', required: true, localized: true, admin: { description: 'Template with {title} placeholder.' } },
        { name: 'viewAllLink', type: 'text', required: true, localized: true },
      ],
    },

    // ── closer ────────────────────────────────────────────────────────────────
    {
      name: 'closer',
      type: 'group',
      admin: { description: 'TERMINUS / end-of-line closing section copy.' },
      fields: [
        { name: 'heading', type: 'text', required: true, localized: true },
        { name: 'headingDot', type: 'text', required: true, localized: true },
        { name: 'subheading', type: 'text', required: true, localized: true },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
        {
          name: 'rows',
          type: 'group',
          fields: [
            {
              name: 'contact',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'description', type: 'text', required: true, localized: true },
                { name: 'action', type: 'text', required: true, localized: true },
              ],
            },
            {
              name: 'connect',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'description', type: 'text', required: true, localized: true },
                { name: 'action', type: 'text', required: true, localized: true },
              ],
            },
            {
              name: 'read',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'action', type: 'text', required: true, localized: true },
              ],
            },
            {
              name: 'about',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'description', type: 'text', required: true, localized: true },
                { name: 'action', type: 'text', required: true, localized: true },
              ],
            },
          ],
        },
        {
          name: 'attribution',
          type: 'group',
          fields: [
            { name: 'text', type: 'text', required: true, localized: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
        {
          name: 'terminal',
          type: 'group',
          admin: { description: 'Departure-board terminal chrome copy.' },
          fields: [
            { name: 'title', type: 'text', required: true, localized: true },
            { name: 'city', type: 'text', required: true, localized: true },
            { name: 'encoding', type: 'text', required: true, localized: true },
            { name: 'destinationsLabel', type: 'text', required: true, localized: true, admin: { description: 'Template with {count} placeholder.' } },
            { name: 'prompt', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
  ],
}
