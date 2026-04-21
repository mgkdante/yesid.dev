import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const NavLinks: GlobalConfig = {
  slug: 'nav-links',
  admin: { group: 'Pages', description: 'Top navigation + menu overlay + shared chrome labels.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'navLinks',
      type: 'array',
      labels: { singular: 'Nav Link', plural: 'Nav Links' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'href', type: 'text', required: true },
        {
          name: 'priority',
          type: 'select',
          required: true,
          defaultValue: '1',
          options: [
            { label: '1 — always visible', value: '1' },
            { label: '2 — hidden on narrow', value: '2' },
          ],
        },
      ],
    },
    {
      name: 'menuItems',
      type: 'array',
      labels: { singular: 'Menu Item', plural: 'Menu Items' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'href', type: 'text', required: true },
        { name: 'subtitle', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'metroBookends',
      type: 'group',
      fields: [
        { name: 'departure', type: 'text', required: true, localized: true },
        { name: 'featured', type: 'text', required: true, localized: true },
        { name: 'about', type: 'text', required: true, localized: true },
        { name: 'blog', type: 'text', required: true, localized: true },
        { name: 'terminal', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'navDirections',
      type: 'group',
      fields: [
        { name: 'previous', type: 'text', required: true, localized: true },
        { name: 'next', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'sharedChrome',
      type: 'group',
      fields: [
        { name: 'openMenuAria', type: 'text', required: true, localized: true },
        { name: 'closeMenuAria', type: 'text', required: true, localized: true },
        { name: 'footerNavAria', type: 'text', required: true, localized: true },
        { name: 'menuOverlayAria', type: 'text', required: true, localized: true },
        { name: 'menuOverlayFooterLabel', type: 'text', required: true, localized: true },
        { name: 'searchPlaceholder', type: 'text', required: true, localized: true },
        { name: 'clearFiltersLabel', type: 'text', required: true, localized: true },
        { name: 'tocToggleSectionAria', type: 'text', required: true, localized: true },
        { name: 'tocHeading', type: 'text', required: true, localized: true },
        { name: 'tocMobileButton', type: 'text', required: true, localized: true },
      ],
    },
  ],
}
